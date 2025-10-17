const express = require('express');
const bcrypt = require('bcryptjs');
const { getQuery, allQuery, runQuery } = require('../database/db');
const { requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin and manager only)
router.get('/', requireManagerOrAdmin, async (req, res) => {
    try {
        const users = await allQuery(`
            SELECT 
                u.id, u.username, u.email, u.role, u.full_name, u.is_active, 
                u.created_at, u.updated_at,
                creator.full_name as created_by_name
            FROM users u
            LEFT JOIN users creator ON u.created_by = creator.id
            ORDER BY u.created_at DESC
        `);

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user by ID (admin and manager only)
router.get('/:id', requireManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await getQuery(`
            SELECT 
                u.id, u.username, u.email, u.role, u.full_name, u.is_active, 
                u.created_at, u.updated_at,
                creator.full_name as created_by_name
            FROM users u
            LEFT JOIN users creator ON u.created_by = creator.id
            WHERE u.id = ?
        `, [id]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new user (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;

        if (!username || !email || !password || !full_name || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate role
        if (!['admin', 'manager', 'cashier'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if user already exists
        const existingUser = await getQuery(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await runQuery(
            'INSERT INTO users (username, email, password_hash, full_name, role, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, password_hash, full_name, role, req.user.id]
        );

        // Log user creation
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'create_user', 'user', result.id, `Created ${role} user: ${username}`]
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.id 
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, role, is_active } = req.body;

        // Check if user exists
        const existingUser = await getQuery('SELECT * FROM users WHERE id = ?', [id]);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if username/email already exists (excluding current user)
        if (username || email) {
            const duplicateUser = await getQuery(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username || existingUser.username, email || existingUser.email, id]
            );

            if (duplicateUser) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }
        }

        // Validate role if provided
        if (role && !['admin', 'manager', 'cashier'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Update user
        const updateFields = [];
        const updateValues = [];

        if (username) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (full_name) {
            updateFields.push('full_name = ?');
            updateValues.push(full_name);
        }
        if (role) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }
        if (typeof is_active === 'boolean') {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        await runQuery(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Log user update
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'update_user', 'user', id, `Updated user: ${username || existingUser.username}`]
        );

        res.json({ message: 'User updated successfully' });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting self
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Check if user exists
        const user = await getQuery('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Soft delete by setting is_active to false
        await runQuery(
            'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        // Log user deletion
        await runQuery(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'delete_user', 'user', id, `Deactivated user: ${user.username}`]
        );

        res.json({ message: 'User deactivated successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get activity logs for a user (admin and manager only)
router.get('/:id/activity', requireManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const activities = await allQuery(`
            SELECT action, entity_type, entity_id, details, ip_address, created_at
            FROM activity_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [id, limit, offset]);

        const totalCount = await getQuery(
            'SELECT COUNT(*) as count FROM activity_logs WHERE user_id = ?',
            [id]
        );

        res.json({
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                pages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
