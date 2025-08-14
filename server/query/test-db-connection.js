const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    const connection = await mysql.createConnection({
      host: 'srv1639.hstgr.io',
      user: 'u745362362_crmusername',
      password: 'Aedentek@123#',
      database: 'u745362362_crm'
    });
    
    console.log('✅ Connected successfully to database');
    
    // Test if patients table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'patients'");
    console.log('Patients table:', tables.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND');
    
    // Test if patient_payments table exists
    const [paymentTables] = await connection.execute("SHOW TABLES LIKE 'patient_payments'");
    console.log('Patient payments table:', paymentTables.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND');
    
    // If patient_payments doesn't exist, create it
    if (paymentTables.length === 0) {
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
      console.log('✅ Patient payments table created');
    }
    
    // Test basic operations
    console.log('Testing basic operations...');
    
    // Check patients count
    const [patientCount] = await connection.execute('SELECT COUNT(*) as count FROM patients');
    console.log(`📊 Patients in database: ${patientCount[0].count}`);
    
    // Check payments count
    const [paymentCount] = await connection.execute('SELECT COUNT(*) as count FROM patient_payments');
    console.log(`💰 Payments in database: ${paymentCount[0].count}`);
    
    await connection.end();
    console.log('✅ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
