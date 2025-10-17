const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/db');
const { requireManagerOrAdmin, requireCashierOrAbove } = require('../middleware/auth');

const router = express.Router();

// Get all products with optional search and filtering
router.get('/', requireCashierOrAbove, async (req, res) => {
    try {
        const { search, category, minStock, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['is_active = TRUE'];
        let queryParams = [];

        if (search) {
            whereConditions.push('(name LIKE ? OR sku LIKE ? OR barcode LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (category) {
            whereConditions.push('category = ?');
            queryParams.push(category);
        }

        if (minStock !== undefined) {
            whereConditions.push('stock_quantity <= ?');
            queryParams.push(minStock);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const products = await allQuery(`
            SELECT * FROM products
            ${whereClause}
            ORDER BY name
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        const totalCount = await getQuery(
            `SELECT COUNT(*) as count FROM products ${whereClause}`,
            queryParams
        );

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                pages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get product by ID
router.get('/:id', requireCashierOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getQuery('SELECT * FROM products WHERE id = ? AND is_active = TRUE', [id]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get product by SKU or barcode (for quick lookup)
router.get('/lookup/:identifier', requireCashierOrAbove, async (req, res) => {
    try {
        const { identifier } = req.params;
        const product = await getQuery(
            'SELECT * FROM products WHERE (sku = ? OR barcode = ?) AND is_active = TRUE',
            [identifier, identifier]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product });
    } catch (error) {
        console.error('Product lookup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new product (manager and admin only)
router.post('/', requireManagerOrAdmin, async (req, res) => {
    try {
        const {
            name, description, sku, barcode, price, cost,
            stock_quantity, min_stock_level, category, supplier
        } = req.body;

        if (!name || !sku || !price) {
            return res.status(400).json({ error: 'Name, SKU, and price are required' });
        }

        // Check if SKU already exists
        const existingProduct = await getQuery(
            'SELECT id FROM products WHERE sku = ?',
            [sku]
        );

        if (existingProduct) {
            return res.status(400).json({ error: 'SKU already exists' });
        }

        // Create product
        const result = await runQuery(
            `INSERT INTO products (
                name, description, sku, barcode, price, cost, 
                stock_quantity, min_stock_level, category, supplier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, description || '', sku, barcode || '', price, cost || 0,
                stock_quantity || 0, min_stock_level || 10, category || '', supplier || ''
            ]
        );

        // Log product creation
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'create_product', 'product', result.id, `Created product: ${name}`]
        );

        res.status(201).json({ 
            message: 'Product created successfully',
            productId: result.id 
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update product (manager and admin only)
router.put('/:id', requireManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, sku, barcode, price, cost,
            stock_quantity, min_stock_level, category, supplier, is_active
        } = req.body;

        // Check if product exists
        const existingProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if SKU already exists (excluding current product)
        if (sku && sku !== existingProduct.sku) {
            const duplicateProduct = await getQuery(
                'SELECT id FROM products WHERE sku = ? AND id != ?',
                [sku, id]
            );

            if (duplicateProduct) {
                return res.status(400).json({ error: 'SKU already exists' });
            }
        }

        // Update product
        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (sku) {
            updateFields.push('sku = ?');
            updateValues.push(sku);
        }
        if (barcode !== undefined) {
            updateFields.push('barcode = ?');
            updateValues.push(barcode);
        }
        if (price) {
            updateFields.push('price = ?');
            updateValues.push(price);
        }
        if (cost !== undefined) {
            updateFields.push('cost = ?');
            updateValues.push(cost);
        }
        if (stock_quantity !== undefined) {
            updateFields.push('stock_quantity = ?');
            updateValues.push(stock_quantity);
        }
        if (min_stock_level !== undefined) {
            updateFields.push('min_stock_level = ?');
            updateValues.push(min_stock_level);
        }
        if (category !== undefined) {
            updateFields.push('category = ?');
            updateValues.push(category);
        }
        if (supplier !== undefined) {
            updateFields.push('supplier = ?');
            updateValues.push(supplier);
        }
        if (typeof is_active === 'boolean') {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        await runQuery(
            `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Log product update
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'update_product', 'product', id, `Updated product: ${name || existingProduct.name}`]
        );

        res.json({ message: 'Product updated successfully' });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product (admin only)
router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Soft delete by setting is_active to false
        await runQuery(
            'UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        // Log product deletion
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'delete_product', 'product', id, `Deactivated product: ${product.name}`]
        );

        res.json({ message: 'Product deactivated successfully' });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get low stock products
router.get('/alerts/low-stock', requireManagerOrAdmin, async (req, res) => {
    try {
        const lowStockProducts = await allQuery(`
            SELECT * FROM products
            WHERE stock_quantity <= min_stock_level 
            AND stock_quantity > 0 
            AND is_active = TRUE
            ORDER BY stock_quantity ASC
        `);

        const outOfStockProducts = await allQuery(`
            SELECT * FROM products
            WHERE stock_quantity = 0 
            AND is_active = TRUE
            ORDER BY name
        `);

        res.json({
            lowStock: lowStockProducts,
            outOfStock: outOfStockProducts
        });

    } catch (error) {
        console.error('Get stock alerts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get categories
router.get('/categories/list', requireCashierOrAbove, async (req, res) => {
    try {
        const categories = await allQuery(`
            SELECT DISTINCT category 
            FROM products 
            WHERE category IS NOT NULL 
            AND category != '' 
            AND is_active = TRUE
            ORDER BY category
        `);

        res.json({ categories: categories.map(c => c.category) });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
