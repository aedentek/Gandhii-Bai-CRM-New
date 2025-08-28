import db from './db/config.js';
import fs from 'fs';

async function createTable() {
  try {
    const sql = fs.readFileSync('./dbmodels/create-medicine-stock-history-table.sql', 'utf8');
    await db.query(sql);
    console.log('✅ Medicine stock history table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();
