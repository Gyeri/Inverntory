const { getQuery, runQuery } = require('./db');

async function migrateCategories() {
    try {
        console.log('Starting categories migration...');
        
        // Check if categories table exists
        const tableExists = await getQuery(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='categories'
        `);
        
        if (!tableExists) {
            console.log('Creating categories table...');
            
            // Create categories table
            await runQuery(`
                CREATE TABLE categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    is_active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('Categories table created successfully');
            
            // Migrate existing categories from products table
            console.log('Migrating existing categories...');
            
            const existingCategories = await getQuery(`
                SELECT DISTINCT category 
                FROM products 
                WHERE category IS NOT NULL 
                AND category != '' 
                AND is_active = TRUE
            `);
            
            if (existingCategories && existingCategories.length > 0) {
                for (const category of existingCategories) {
                    try {
                        await runQuery(`
                            INSERT INTO categories (name, description) 
                            VALUES (?, ?)
                        `, [category.category, 'Migrated from products table']);
                        
                        console.log(`Migrated category: ${category.category}`);
                    } catch (error) {
                        if (error.message.includes('UNIQUE constraint failed')) {
                            console.log(`Category already exists: ${category.category}`);
                        } else {
                            console.error(`Error migrating category ${category.category}:`, error);
                        }
                    }
                }
            }
            
            console.log('Categories migration completed successfully');
        } else {
            console.log('Categories table already exists, skipping migration');
        }
        
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateCategories()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateCategories };
