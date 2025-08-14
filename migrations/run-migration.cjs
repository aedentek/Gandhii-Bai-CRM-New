const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const pool = require('../db.cjs');

async function executeMigration() {
    try {
        const sql = await fs.readFile(path.join(__dirname, 'create_patient_attendance_table.sql'), 'utf8');
        
        console.log('Executing migration...');
        await pool.query(sql);
        console.log('Migration completed successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error executing migration:', error);
        process.exit(1);
    }
}

executeMigration();
