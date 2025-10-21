const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/db');
const { requireCashierOrAbove, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Create new sale/transaction
router.post('/', requireCashierOrAbove, async (req, res) => {
    const transaction = await runQuery('BEGIN TRANSACTION');
    
    try {
        const { 
            items, 
            discount_amount = 0, 
            payment_method = 'cash', 
            customer_id, 
            credit_due_date 
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Sale items are required' });
        }

        // Validate credit sale requirements
        if (payment_method === 'credit') {
            if (!customer_id) {
                return res.status(400).json({ error: 'Customer is required for credit sales' });
            }
            if (!credit_due_date) {
                return res.status(400).json({ error: 'Credit due date is required' });
            }

            // Check customer exists and has credit limit
            const customer = await getQuery(
                'SELECT * FROM customers WHERE id = ? AND is_active = 1',
                [customer_id]
            );

            if (!customer) {
                return res.status(400).json({ error: 'Customer not found' });
            }
        }

        // Generate transaction ID
        const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Calculate totals
        let total_amount = 0;
        const saleItems = [];

        // Validate items and calculate totals
        for (const item of items) {
            const { product_id, quantity } = item;

            if (!product_id || !quantity || quantity <= 0) {
                throw new Error('Invalid item data');
            }

            // Get product details
            const product = await getQuery(
                'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
                [product_id]
            );

            if (!product) {
                throw new Error(`Product with ID ${product_id} not found`);
            }

            if (product.stock_quantity < quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`);
            }

            const itemTotal = product.price * quantity;
            total_amount += itemTotal;

            saleItems.push({
                product_id,
                quantity,
                unit_price: product.price,
                total_price: itemTotal,
                product_name: product.name
            });
        }

        // Apply discount
        total_amount = Math.max(0, total_amount - discount_amount);

        // For credit sales, validate credit limit
        if (payment_method === 'credit') {
            const totalPaid = await getQuery(
                'SELECT COALESCE(SUM(amount), 0) as total FROM credit_payments WHERE customer_id = ?',
                [customer_id]
            );

            const customer = await getQuery(
                'SELECT * FROM customers WHERE id = ?',
                [customer_id]
            );

            const currentOutstanding = customer.outstanding_balance;
            const newOutstanding = currentOutstanding + total_amount;

            if (customer.credit_limit > 0 && newOutstanding > customer.credit_limit) {
                return res.status(400).json({ 
                    error: `Credit limit exceeded. Credit limit: ₦${customer.credit_limit.toFixed(2)}, Outstanding: ₦${currentOutstanding.toFixed(2)}, New purchase: ₦${total_amount.toFixed(2)}` 
                });
            }
        }

        // Create sale record
        const credit_amount = payment_method === 'credit' ? total_amount : 0;
        const saleResult = await runQuery(
            'INSERT INTO sales (transaction_id, cashier_id, customer_id, total_amount, discount_amount, payment_method, credit_due_date, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [transaction_id, req.user.id, customer_id, total_amount, discount_amount, payment_method, credit_due_date, credit_amount]
        );

        const sale_id = saleResult.id;

        // Create sale items and update stock
        for (const item of saleItems) {
            // Insert sale item
            await runQuery(
                'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                [sale_id, item.product_id, item.quantity, item.unit_price, item.total_price]
            );

            // Update product stock
            const product = await getQuery('SELECT * FROM products WHERE id = ?', [item.product_id]);
            const new_stock = product.stock_quantity - item.quantity;

            await runQuery(
                'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [new_stock, item.product_id]
            );

            // Log stock movement
            await runQuery(
                `INSERT INTO stock_movements (
                    product_id, movement_type, quantity, previous_stock, new_stock, 
                    reason, reference_id, reference_type, performed_by
                ) VALUES (?, 'out', ?, ?, ?, ?, ?, 'sale', ?)`,
                [
                    item.product_id, item.quantity, product.stock_quantity, new_stock,
                    `Sale transaction ${transaction_id}`, sale_id, req.user.id
                ]
            );
        }

        // Update customer outstanding balance for credit sales
        if (payment_method === 'credit') {
            await runQuery(
                'UPDATE customers SET outstanding_balance = outstanding_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [total_amount, customer_id]
            );
        }

        await runQuery('COMMIT');

        // Log sale activity
        const paymentText = payment_method === 'credit' ? 'credit' : `₦${total_amount}`;
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'create_sale', 'sale', sale_id, `Created ${payment_method} sale ${transaction_id} for ${paymentText}`]
        );

        res.status(201).json({
            message: 'Sale completed successfully',
            transaction: {
                id: sale_id,
                transaction_id,
                total_amount,
                discount_amount,
                payment_method,
                items: saleItems
            }
        });

    } catch (error) {
        await runQuery('ROLLBACK');
        console.error('Create sale error:', error);
        res.status(400).json({ error: error.message || 'Failed to process sale' });
    }
});

// Get sales with optional filtering
router.get('/', requireManagerOrAdmin, async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            cashier_id, 
            payment_method, 
            page = 1, 
            limit = 50 
        } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (startDate) {
            whereConditions.push('DATE(s.created_at) >= DATE(?)');
            queryParams.push(startDate);
        }

        if (endDate) {
            whereConditions.push('DATE(s.created_at) <= DATE(?)');
            queryParams.push(endDate);
        }

        if (cashier_id) {
            whereConditions.push('s.cashier_id = ?');
            queryParams.push(cashier_id);
        }

        if (payment_method) {
            whereConditions.push('s.payment_method = ?');
            queryParams.push(payment_method);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const sales = await allQuery(`
            SELECT 
                s.*,
                u.full_name as cashier_name,
                u.username as cashier_username
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        const totalCount = await getQuery(
            `SELECT COUNT(*) as count FROM sales s ${whereClause}`,
            queryParams
        );

        res.json({
            sales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                pages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sale by ID with items
router.get('/:id', requireManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Get sale details
        const sale = await getQuery(`
            SELECT 
                s.*,
                u.full_name as cashier_name,
                u.username as cashier_username
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            WHERE s.id = ?
        `, [id]);

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Get sale items
        const items = await allQuery(`
            SELECT 
                si.*,
                p.name as product_name,
                p.sku as product_sku
            FROM sale_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `, [id]);

        res.json({
            sale,
            items
        });

    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get today's sales summary
router.get('/dashboard/today', requireCashierOrAbove, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Today's totals
        const todayStats = await getQuery(`
            SELECT 
                COUNT(*) as transaction_count,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(AVG(total_amount), 0) as average_transaction
            FROM sales 
            WHERE DATE(created_at) = DATE(?)
        `, [today]);

        // Hourly breakdown
        const hourlySales = await allQuery(`
            SELECT 
                strftime('%H', created_at) as hour,
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as sales
            FROM sales 
            WHERE DATE(created_at) = DATE(?)
            GROUP BY strftime('%H', created_at)
            ORDER BY hour
        `, [today]);

        // Top selling products today
        const topProducts = await allQuery(`
            SELECT 
                p.name,
                p.sku,
                SUM(si.quantity) as total_sold,
                SUM(si.total_price) as total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE DATE(s.created_at) = DATE(?)
            GROUP BY si.product_id, p.name, p.sku
            ORDER BY total_sold DESC
            LIMIT 10
        `, [today]);

        res.json({
            todayStats,
            hourlySales,
            topProducts
        });

    } catch (error) {
        console.error('Get today sales error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent transactions (for cashier dashboard)
router.get('/dashboard/recent', requireCashierOrAbove, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const recentSales = await allQuery(`
            SELECT 
                s.id,
                s.transaction_id,
                s.total_amount,
                s.created_at,
                COUNT(si.id) as item_count
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE s.cashier_id = ?
            GROUP BY s.id, s.transaction_id, s.total_amount, s.created_at
            ORDER BY s.created_at DESC
            LIMIT ?
        `, [req.user.id, limit]);

        res.json({ recentSales });

    } catch (error) {
        console.error('Get recent sales error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
