const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/db');
const { requireCashierOrAbove, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Create new customer
router.post('/', requireCashierOrAbove, async (req, res) => {
    try {
        const { name, phone, email, address, credit_limit = 0 } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        // Check if customer already exists (by phone or email)
        if (phone || email) {
            let existingCustomer = null;
            if (phone) {
                existingCustomer = await getQuery(
                    'SELECT id FROM customers WHERE phone = ? AND is_active = 1',
                    [phone]
                );
            }
            if (!existingCustomer && email) {
                existingCustomer = await getQuery(
                    'SELECT id FROM customers WHERE email = ? AND is_active = 1',
                    [email]
                );
            }

            if (existingCustomer) {
                return res.status(400).json({ error: 'Customer with this phone or email already exists' });
            }
        }

        const result = await runQuery(
            'INSERT INTO customers (name, phone, email, address, credit_limit) VALUES (?, ?, ?, ?, ?)',
            [name, phone, email, address, credit_limit]
        );

        // Log activity
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'create_customer', 'customer', result.id, `Created customer: ${name}`]
        );

        res.status(201).json({
            message: 'Customer created successfully',
            customer: {
                id: result.id,
                name,
                phone,
                email,
                address,
                credit_limit
            }
        });

    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Get all customers
router.get('/', requireCashierOrAbove, async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE c.is_active = 1';
        let queryParams = [];

        if (search) {
            whereClause += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
            const searchTerm = `%${search}%`;
            queryParams = [searchTerm, searchTerm, searchTerm];
        }

        const customers = await allQuery(`
            SELECT 
                c.*,
                COUNT(s.id) as total_sales,
                COALESCE(SUM(CASE WHEN s.payment_method = 'credit' THEN s.credit_amount ELSE 0 END), 0) as total_credit_sales,
                COALESCE(SUM(cp.amount), 0) as total_payments
            FROM customers c
            LEFT JOIN sales s ON c.id = s.customer_id
            LEFT JOIN credit_payments cp ON c.id = cp.customer_id
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.name
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        const totalCount = await getQuery(
            `SELECT COUNT(*) as count FROM customers c ${whereClause}`,
            queryParams
        );

        res.json({
            customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                pages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search customers (for cashier dropdown)
router.get('/search', requireCashierOrAbove, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ customers: [] });
        }

        const customers = await allQuery(`
            SELECT 
                id, 
                name, 
                phone, 
                email, 
                credit_limit,
                outstanding_balance
            FROM customers 
            WHERE is_active = 1 
            AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)
            ORDER BY name
            LIMIT 10
        `, [`%${q}%`, `%${q}%`, `%${q}%`]);

        res.json({ customers });

    } catch (error) {
        console.error('Search customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get customer by ID with credit history
router.get('/:id', requireCashierOrAbove, async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await getQuery(
            'SELECT * FROM customers WHERE id = ? AND is_active = 1',
            [id]
        );

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get credit sales
        const creditSales = await allQuery(`
            SELECT 
                s.*,
                u.full_name as cashier_name
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            WHERE s.customer_id = ? AND s.payment_method = 'credit'
            ORDER BY s.created_at DESC
        `, [id]);

        // Get payments
        const payments = await allQuery(`
            SELECT 
                cp.*,
                u.full_name as recorded_by_name
            FROM credit_payments cp
            LEFT JOIN users u ON cp.recorded_by = u.id
            WHERE cp.customer_id = ?
            ORDER BY cp.payment_date DESC
        `, [id]);

        res.json({
            customer,
            creditSales,
            payments
        });

    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update customer
router.put('/:id', requireManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address, credit_limit } = req.body;

        const customer = await getQuery(
            'SELECT * FROM customers WHERE id = ? AND is_active = 1',
            [id]
        );

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await runQuery(
            'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, credit_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, phone, email, address, credit_limit, id]
        );

        // Log activity
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'update_customer', 'customer', id, `Updated customer: ${name}`]
        );

        res.json({ message: 'Customer updated successfully' });

    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Record credit payment
router.post('/:id/payments', requireCashierOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { sale_id, amount, payment_date, payment_method = 'cash', notes } = req.body;

        if (!sale_id || !amount || !payment_date) {
            return res.status(400).json({ error: 'Sale ID, amount, and payment date are required' });
        }

        const customer = await getQuery(
            'SELECT * FROM customers WHERE id = ? AND is_active = 1',
            [id]
        );

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const sale = await getQuery(
            'SELECT * FROM sales WHERE id = ? AND customer_id = ? AND payment_method = "credit"',
            [sale_id, id]
        );

        if (!sale) {
            return res.status(404).json({ error: 'Credit sale not found' });
        }

        // Check if payment exceeds remaining balance
        const totalPaid = await getQuery(
            'SELECT COALESCE(SUM(amount), 0) as total FROM credit_payments WHERE sale_id = ?',
            [sale_id]
        );

        const remainingBalance = sale.credit_amount - totalPaid.total;
        if (amount > remainingBalance) {
            return res.status(400).json({ 
                error: `Payment amount exceeds remaining balance. Remaining: ₦${remainingBalance.toFixed(2)}` 
            });
        }

        await runQuery(
            'INSERT INTO credit_payments (sale_id, customer_id, amount, payment_date, payment_method, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [sale_id, id, amount, payment_date, payment_method, notes, req.user.id]
        );

        // Update customer's outstanding balance
        await runQuery(
            'UPDATE customers SET outstanding_balance = outstanding_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [amount, id]
        );

        // Log activity
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'record_payment', 'credit_payment', null, `Recorded payment of ₦${amount} for customer: ${customer.name}`]
        );

        res.json({ message: 'Payment recorded successfully' });

    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

// Get overdue credits
router.get('/overdue/list', requireCashierOrAbove, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const overdueCredits = await allQuery(`
            SELECT 
                s.*,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                u.full_name as cashier_name,
                COALESCE(SUM(cp.amount), 0) as total_payments,
                (s.credit_amount - COALESCE(SUM(cp.amount), 0)) as remaining_balance,
                (julianday('now') - julianday(s.credit_due_date)) as days_overdue
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN credit_payments cp ON s.id = cp.sale_id
            WHERE s.payment_method = 'credit'
            AND s.credit_due_date < date('now')
            GROUP BY s.id
            HAVING (s.credit_amount - COALESCE(SUM(cp.amount), 0)) > 0
            AND days_overdue >= ?
            ORDER BY s.credit_due_date ASC
        `, [days]);

        res.json({ overdueCredits });

    } catch (error) {
        console.error('Get overdue credits error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get overdue credit alerts summary (for dashboard)
router.get('/overdue/alerts', requireCashierOrAbove, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        // Get count and total amount of overdue credits
        const overdueSummary = await getQuery(`
            SELECT 
                COUNT(*) as overdue_count,
                COALESCE(SUM(s.credit_amount - COALESCE(total_payments, 0)), 0) as total_overdue_amount
            FROM sales s
            LEFT JOIN (
                SELECT sale_id, SUM(amount) as total_payments
                FROM credit_payments
                GROUP BY sale_id
            ) cp ON s.id = cp.sale_id
            WHERE s.payment_method = 'credit'
            AND s.credit_due_date < date('now')
            AND (s.credit_amount - COALESCE(total_payments, 0)) > 0
            AND (julianday('now') - julianday(s.credit_due_date)) >= ?
        `, [days]);

        // Get recent overdue credits (last 5)
        const recentOverdue = await allQuery(`
            SELECT 
                s.id,
                s.transaction_id,
                s.credit_amount,
                s.credit_due_date,
                c.name as customer_name,
                c.phone as customer_phone,
                COALESCE(SUM(cp.amount), 0) as total_payments,
                (s.credit_amount - COALESCE(SUM(cp.amount), 0)) as remaining_balance,
                (julianday('now') - julianday(s.credit_due_date)) as days_overdue
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN credit_payments cp ON s.id = cp.sale_id
            WHERE s.payment_method = 'credit'
            AND s.credit_due_date < date('now')
            GROUP BY s.id
            HAVING (s.credit_amount - COALESCE(SUM(cp.amount), 0)) > 0
            AND days_overdue >= ?
            ORDER BY s.credit_due_date ASC
            LIMIT 5
        `, [days]);

        res.json({
            summary: overdueSummary,
            recentOverdue
        });

    } catch (error) {
        console.error('Get overdue alerts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get credit summary for dashboard
router.get('/credit/summary', requireCashierOrAbove, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Total outstanding credits
        const totalOutstanding = await getQuery(`
            SELECT COALESCE(SUM(outstanding_balance), 0) as total
            FROM customers 
            WHERE is_active = 1
        `);

        // Overdue credits count and amount
        const overdueStats = await getQuery(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(s.credit_amount - COALESCE(cp.total_payments, 0)), 0) as amount
            FROM sales s
            LEFT JOIN (
                SELECT sale_id, SUM(amount) as total_payments
                FROM credit_payments
                GROUP BY sale_id
            ) cp ON s.id = cp.sale_id
            WHERE s.payment_method = 'credit'
            AND s.credit_due_date < date('now')
            AND (s.credit_amount - COALESCE(cp.total_payments, 0)) > 0
        `);

        // Recent payments (last 7 days)
        const recentPayments = await allQuery(`
            SELECT 
                cp.*,
                c.name as customer_name,
                s.transaction_id
            FROM credit_payments cp
            JOIN customers c ON cp.customer_id = c.id
            JOIN sales s ON cp.sale_id = s.id
            WHERE cp.payment_date >= date('now', '-7 days')
            ORDER BY cp.payment_date DESC
            LIMIT 10
        `);

        // Credit sales this month
        const monthlyCredits = await getQuery(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(credit_amount), 0) as amount
            FROM sales 
            WHERE payment_method = 'credit'
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `);

        res.json({
            totalOutstanding: totalOutstanding.total,
            overdueCredits: overdueStats.count,
            overdueAmount: overdueStats.amount,
            recentPayments,
            monthlyCredits: monthlyCredits.count,
            monthlyAmount: monthlyCredits.amount
        });

    } catch (error) {
        console.error('Get credit summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get customer credit history
router.get('/:id/credit-history', requireCashierOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get credit sales
        const creditSales = await allQuery(`
            SELECT 
                s.*,
                u.full_name as cashier_name,
                COALESCE(cp.total_payments, 0) as total_payments,
                (s.credit_amount - COALESCE(cp.total_payments, 0)) as remaining_balance
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN (
                SELECT sale_id, SUM(amount) as total_payments
                FROM credit_payments
                GROUP BY sale_id
            ) cp ON s.id = cp.sale_id
            WHERE s.customer_id = ? AND s.payment_method = 'credit'
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `, [id, limit, offset]);

        // Get payment history
        const payments = await allQuery(`
            SELECT 
                cp.*,
                u.full_name as recorded_by_name,
                s.transaction_id
            FROM credit_payments cp
            LEFT JOIN users u ON cp.recorded_by = u.id
            LEFT JOIN sales s ON cp.sale_id = s.id
            WHERE cp.customer_id = ?
            ORDER BY cp.payment_date DESC
            LIMIT ? OFFSET ?
        `, [id, limit, offset]);

        // Get totals
        const totals = await getQuery(`
            SELECT 
                COALESCE(SUM(s.credit_amount), 0) as total_credit,
                COALESCE(SUM(cp.amount), 0) as total_paid,
                COALESCE(SUM(s.credit_amount - COALESCE(cp.total_payments, 0)), 0) as total_outstanding
            FROM sales s
            LEFT JOIN (
                SELECT sale_id, SUM(amount) as total_payments
                FROM credit_payments
                GROUP BY sale_id
            ) cp ON s.id = cp.sale_id
            WHERE s.customer_id = ? AND s.payment_method = 'credit'
        `, [id]);

        res.json({
            creditSales,
            payments,
            totals
        });

    } catch (error) {
        console.error('Get credit history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all payments (for managers and admins)
router.get('/payments/all', requireManagerOrAdmin, async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            customer_id, 
            payment_method, 
            page = 1, 
            limit = 50 
        } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (startDate) {
            whereConditions.push('DATE(cp.payment_date) >= DATE(?)');
            queryParams.push(startDate);
        }

        if (endDate) {
            whereConditions.push('DATE(cp.payment_date) <= DATE(?)');
            queryParams.push(endDate);
        }

        if (customer_id) {
            whereConditions.push('cp.customer_id = ?');
            queryParams.push(customer_id);
        }

        if (payment_method) {
            whereConditions.push('cp.payment_method = ?');
            queryParams.push(payment_method);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const payments = await allQuery(`
            SELECT 
                cp.*,
                c.name as customer_name,
                c.phone as customer_phone,
                u.full_name as recorded_by_name,
                s.transaction_id
            FROM credit_payments cp
            LEFT JOIN customers c ON cp.customer_id = c.id
            LEFT JOIN users u ON cp.recorded_by = u.id
            LEFT JOIN sales s ON cp.sale_id = s.id
            ${whereClause}
            ORDER BY cp.payment_date DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        const totalCount = await getQuery(
            `SELECT COUNT(*) as count FROM credit_payments cp ${whereClause}`,
            queryParams
        );

        res.json({
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                pages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
