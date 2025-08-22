import mysql from 'mysql2/promise';
import fs from 'fs';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function createMedicineSettlementTable() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create medicine_settlement_history table
    console.log('Creating medicine_settlement_history table...');
    const sql = fs.readFileSync('./create-medicine-settlement-history-table.sql', 'utf8');
    await connection.execute(sql);
    console.log('✅ medicine_settlement_history table created');

    console.log('🎉 Setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createMedicineSettlementTable();
