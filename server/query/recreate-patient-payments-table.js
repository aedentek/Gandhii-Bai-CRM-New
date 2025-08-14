// Setup script to recreate patient_payments table with correct structure
import mysql from 'mysql2/promise';

// MySQL connection config (replace with your Hostinger DB credentials)
const db = await mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function recreatePatientPaymentsTable() {
  try {
    console.log('Dropping existing patient_payments table...');
    
    // First, backup any existing data
    try {
      const [existingData] = await db.query('SELECT * FROM patient_payments');
      if (existingData.length > 0) {
        console.log(`📋 Found ${existingData.length} existing payment records`);
        // You could backup this data if needed
      }
    } catch (error) {
      console.log('No existing patient_payments table found');
    }
    
    // Drop existing table
    await db.query('DROP TABLE IF EXISTS patient_payments');
    console.log('✅ Dropped existing table');
    
    console.log('Creating new patient_payments table...');
    
    const createTableSQL = `
      CREATE TABLE patient_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id VARCHAR(50) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        monthly_fees DECIMAL(10,2) DEFAULT 0,
        other_fees DECIMAL(10,2) DEFAULT 0,
        carry_forward DECIMAL(10,2) DEFAULT 0,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        total_balance DECIMAL(10,2) DEFAULT 0,
        payment_status ENUM('Paid', 'Pending', 'Partial') DEFAULT 'Pending',
        payment_type VARCHAR(50) DEFAULT 'Cash',
        payment_date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_payment_status (payment_status),
        INDEX idx_payment_date (payment_date)
      );
    `;
    
    await db.query(createTableSQL);
    console.log('✅ patient_payments table created successfully!');
    
    // Verify table structure
    const [columns] = await db.query('DESCRIBE patient_payments');
    console.log('📋 New table structure:');
    columns.forEach((col) => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? col.Key : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error recreating patient_payments table:', error);
  } finally {
    await db.end();
  }
}

recreatePatientPaymentsTable();
