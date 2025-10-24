const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'inventory.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database with schema
function initializeDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Remove SQL comments (both -- and /* */) before splitting
    schema = schema
        .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
        .replace(/^\s*--.*$/gm, ''); // line comments

    // Split schema into individual statements
    const statements = schema.split(';').map(s => s.trim()).filter(Boolean);

    // Ensure statements run sequentially, then seed
    db.serialize(() => {
        statements.forEach((statement, index) => {
            db.run(statement, (err) => {
                if (err) {
                    console.error(`Error executing statement ${index + 1}:`, err.message);
                }
            });
        });

        // Seed default users if no users exist (runs after schema statements)
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (err) {
                console.error('Failed to count users:', err.message);
                return;
            }
            if (row && row.count === 0) {
                const now = new Date().toISOString();
                
                // Create admin user
                const adminPasswordHash = bcrypt.hashSync('admin123', 10);
                db.run(
                    'INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    ['admin', 'admin@example.com', adminPasswordHash, 'System Administrator', 'admin', 1, now, now],
                    (insertErr) => {
                        if (insertErr) {
                            console.error('Failed to seed admin user:', insertErr.message);
                        } else {
                            console.log('Seeded default admin user (username: admin, password: admin123)');
                            
                            // Create manager user
                            const managerPasswordHash = bcrypt.hashSync('manager123', 10);
                            db.run(
                                'INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                ['manager', 'manager@example.com', managerPasswordHash, 'Store Manager', 'manager', 1, now, now],
                                (managerErr) => {
                                    if (managerErr) {
                                        console.error('Failed to seed manager user:', managerErr.message);
                                    } else {
                                        console.log('Seeded default manager user (username: manager, password: manager123)');
                                        
                                        // Create cashier user
                                        const cashierPasswordHash = bcrypt.hashSync('cashier123', 10);
                                        db.run(
                                            'INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                            ['cashier', 'cashier@example.com', cashierPasswordHash, 'Store Cashier', 'cashier', 1, now, now],
                                            (cashierErr) => {
                                                if (cashierErr) {
                                                    console.error('Failed to seed cashier user:', cashierErr.message);
                                                } else {
                                                    console.log('Seeded default cashier user (username: cashier, password: cashier123)');
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    }
                );
            }
        });
    });
}

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

// Helper function to get single row
const getQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Helper function to get all rows
const allQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Close database connection
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

module.exports = {
    db,
    runQuery,
    getQuery,
    allQuery
};
