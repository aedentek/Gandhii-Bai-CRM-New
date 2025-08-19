const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Direct database connection for migration
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function executeMigration() {
    try {
        // Get the SQL file path from command line argument
        const sqlFileName = process.argv[2];
        if (!sqlFileName) {
            console.error('Please provide SQL file name as argument');
            process.exit(1);
        }
        
        const sqlPath = path.isAbsolute(sqlFileName) ? sqlFileName : path.join(__dirname, sqlFileName);
        const sql = await fs.readFile(sqlPath, 'utf8');
        
        console.log(`Executing migration: ${sqlFileName}...`);
        await pool.query(sql);
        console.log('Migration completed successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error executing migration:', error);
        process.exit(1);
    }
}

executeMigration();
