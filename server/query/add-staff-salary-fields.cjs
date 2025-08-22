const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function addStaffSalaryFields() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    console.log('Adding salary payment fields to staff table...');
    await connection.execute(`
      ALTER TABLE staff 
      ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_mode ENUM('Cash', 'Bank', 'UPI', 'Cheque') DEFAULT NULL
    `);
    console.log('✅ Salary payment fields added to staff table successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addStaffSalaryFields();
