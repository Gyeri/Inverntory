const express = require('express');
const { getQuery, allQuery } = require('../database/db');
const { requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard analytics for managers and admins
router.get('/dashboard', requireManagerOrAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Today's stats
        const todayStats = await getQuery(`
            SELECT 
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue,
                COALESCE(AVG(total_amount), 0) as avg_transaction
            FROM sales 
            WHERE DATE(created_at) = DATE(?)
        `, [today]);

        // Yesterday's stats for comparison
        const yesterdayStats = await getQuery(`
            SELECT 
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM sales 
            WHERE DATE(created_at) = DATE(?)
        `, [yesterday]);

        // Weekly stats
        const weeklyStats = await getQuery(`
            SELECT 
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM sales 
            WHERE DATE(created_at) >= DATE(?)
        `, [weekAgo]);

        // Product stats
        const totalProducts = await getQuery('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
        const lowStockCount = await getQuery(`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE stock_quantity <= min_stock_level AND stock_quantity > 0 AND is_active = TRUE
        `);
        const outOfStockCount = await getQuery(`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE stock_quantity = 0 AND is_active = TRUE
        `);

        // User stats
        const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
        const activeUsers = await getQuery(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM activity_logs 
            WHERE DATE(created_at) = DATE(?)
        `, [today]);

        res.json({
            today: todayStats,
            yesterday: yesterdayStats,
            weekly: weeklyStats,
            products: {
                total: totalProducts.count,
                lowStock: lowStockCount.count,
                outOfStock: outOfStockCount.count
            },
            users: {
                total: totalUsers.count,
                activeToday: activeUsers.count
            }
        });

    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sales trends over time
router.get('/sales-trends', requireManagerOrAdmin, async (req, res) => {
    try {
        const { period = '7days' } = req.query;
        let dateFilter = '';
        let groupBy = '';

        switch (period) {
            case '7days':
                dateFilter = 'DATE(created_at) >= DATE("now", "-7 days")';
                groupBy = 'DATE(created_at)';
                break;
            case '30days':
                dateFilter = 'DATE(created_at) >= DATE("now", "-30 days")';
                groupBy = 'DATE(created_at)';
                break;
            case '12months':
                dateFilter = 'DATE(created_at) >= DATE("now", "-12 months")';
                groupBy = "strftime('%Y-%m', created_at)";
                break;
            default:
                dateFilter = 'DATE(created_at) >= DATE("now", "-7 days")';
                groupBy = 'DATE(created_at)';
        }

        const trends = await allQuery(`
            SELECT 
                ${groupBy} as period,
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue,
                COALESCE(AVG(total_amount), 0) as avg_transaction
            FROM sales 
            WHERE ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period
        `);

        res.json({ trends });

    } catch (error) {
        console.error('Get sales trends error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get top performing products
router.get('/top-products', requireManagerOrAdmin, async (req, res) => {
    try {
        const { period = '30days', limit = 10 } = req.query;
        let dateFilter = '';

        switch (period) {
            case '7days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-7 days")';
                break;
            case '30days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-30 days")';
                break;
            case '90days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-90 days")';
                break;
            default:
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-30 days")';
        }

        const topProducts = await allQuery(`
            SELECT 
                p.id,
                p.name,
                p.sku,
                p.category,
                SUM(si.quantity) as total_sold,
                SUM(si.total_price) as total_revenue,
                COUNT(DISTINCT s.id) as times_sold
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE p.is_active = TRUE ${dateFilter}
            GROUP BY si.product_id, p.id, p.name, p.sku, p.category
            ORDER BY total_revenue DESC
            LIMIT ?
        `, [limit]);

        res.json({ topProducts });

    } catch (error) {
        console.error('Get top products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sales by category
router.get('/sales-by-category', requireManagerOrAdmin, async (req, res) => {
    try {
        const { period = '30days' } = req.query;
        let dateFilter = '';

        switch (period) {
            case '7days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-7 days")';
                break;
            case '30days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-30 days")';
                break;
            case '90days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-90 days")';
                break;
            default:
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-30 days")';
        }

        const categorySales = await allQuery(`
            SELECT 
                p.category,
                COUNT(DISTINCT s.id) as transactions,
                SUM(si.quantity) as total_quantity,
                COALESCE(SUM(si.total_price), 0) as total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE p.category IS NOT NULL AND p.category != '' ${dateFilter}
            GROUP BY p.category
            ORDER BY total_revenue DESC
        `);

        res.json({ categorySales });

    } catch (error) {
        console.error('Get sales by category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get cashier performance
router.get('/cashier-performance', requireManagerOrAdmin, async (req, res) => {
    try {
        const { period = '30days' } = req.query;
        let dateFilter = '';

        switch (period) {
            case '7days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-7 days")';
                break;
            case '30days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-30 days")';
                break;
            case '90days':
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-90 days")';
                break;
            default:
                dateFilter = 'AND DATE(s.created_at) >= DATE("now", "-30 days")';
        }

        const cashierPerformance = await allQuery(`
            SELECT 
                u.id,
                u.full_name,
                u.username,
                COUNT(s.id) as transactions,
                COALESCE(SUM(s.total_amount), 0) as total_revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_transaction,
                MAX(s.created_at) as last_sale
            FROM users u
            LEFT JOIN sales s ON u.id = s.cashier_id ${dateFilter}
            WHERE u.role = 'cashier' AND u.is_active = TRUE
            GROUP BY u.id, u.full_name, u.username
            ORDER BY total_revenue DESC
        `);

        res.json({ cashierPerformance });

    } catch (error) {
        console.error('Get cashier performance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get hourly sales pattern
router.get('/hourly-pattern', requireManagerOrAdmin, async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const hourlyPattern = await allQuery(`
            SELECT 
                strftime('%H', created_at) as hour,
                COUNT(*) as transactions,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM sales 
            WHERE DATE(created_at) >= DATE("now", "-${days} days")
            GROUP BY strftime('%H', created_at)
            ORDER BY hour
        `);

        res.json({ hourlyPattern });

    } catch (error) {
        console.error('Get hourly pattern error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get inventory valuation
router.get('/inventory-valuation', requireManagerOrAdmin, async (req, res) => {
    try {
        const inventoryStats = await getQuery(`
            SELECT 
                COUNT(*) as total_products,
                SUM(stock_quantity) as total_units,
                COALESCE(SUM(stock_quantity * cost), 0) as cost_value,
                COALESCE(SUM(stock_quantity * price), 0) as retail_value
            FROM products 
            WHERE is_active = TRUE
        `);

        const categoryValuation = await allQuery(`
            SELECT 
                category,
                COUNT(*) as product_count,
                SUM(stock_quantity) as total_units,
                COALESCE(SUM(stock_quantity * cost), 0) as cost_value,
                COALESCE(SUM(stock_quantity * price), 0) as retail_value
            FROM products 
            WHERE is_active = TRUE AND category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY retail_value DESC
        `);

        res.json({
            total: inventoryStats,
            byCategory: categoryValuation
        });

    } catch (error) {
        console.error('Get inventory valuation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
 
// Get recent activity logs (system-wide)
router.get('/activity-logs', requireManagerOrAdmin, async (req, res) => {
    try {
        const { limit = 10, page = 1, user_id } = req.query;
        const parsedLimit = Math.min(parseInt(limit, 10) || 10, 100);
        const offset = (parseInt(page, 10) - 1) * parsedLimit;

        const whereClause = user_id ? 'WHERE al.user_id = ?' : '';
        const params = user_id ? [user_id, parsedLimit, offset] : [parsedLimit, offset];

        const activities = await allQuery(
            `SELECT 
                al.user_id,
                u.full_name as user_name,
                al.action,
                al.entity_type,
                al.entity_id,
                al.details,
                al.ip_address,
                al.user_agent,
                al.created_at
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ${whereClause}
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?`,
            params
        );

        res.json({ activities });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});