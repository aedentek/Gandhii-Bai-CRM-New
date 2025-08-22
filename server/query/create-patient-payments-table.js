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

async function createPatientPaymentsTable() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    console.log('Creating patient_payments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS patient_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patientId INT NOT NULL,
        date VARCHAR(20),
        amount DECIMAL(10,2),
        comment TEXT,
        paymentMode VARCHAR(50),
        balanceRemaining DECIMAL(10,2),
        createdBy VARCHAR(100),
        createdAt VARCHAR(30),
        INDEX idx_patient_payments_patientId (patientId)
      )
    `);
    console.log('✅ patient_payments table created successfully');
    
    // Check if table exists and show structure
    const [tables] = await connection.execute("SHOW TABLES LIKE 'patient_payments'");
    console.log('✅ Table verified:', tables.length > 0 ? 'EXISTS' : 'NOT FOUND');
    
    if (tables.length > 0) {
      const [columns] = await connection.execute("DESCRIBE patient_payments");
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? col.Key : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createPatientPaymentsTable();
