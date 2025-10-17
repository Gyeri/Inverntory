const jwt = require('jsonwebtoken');
const { getQuery } = require('../database/db');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await getQuery(
            'SELECT id, username, email, role, full_name, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user || !user.is_active) {
            return res.status(403).json({ error: 'User not found or inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireRole = (roles) => {
    return async (req, res, next) => {
        // Ensure user is authenticated first
        if (!req.user) {
            // try to authenticate
            await authenticateToken(req, res, () => {});
            if (!req.user) {
                return; // authenticateToken already responded
            }
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

const requireAdmin = requireRole(['admin']);
const requireManagerOrAdmin = requireRole(['admin', 'manager']);
const requireCashierOrAbove = requireRole(['admin', 'manager', 'cashier']);

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireManagerOrAdmin,
    requireCashierOrAbove
};
