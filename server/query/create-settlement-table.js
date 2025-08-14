import mysql from 'mysql2/promise';
import fs from 'fs';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
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
