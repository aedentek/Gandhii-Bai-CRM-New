const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
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
