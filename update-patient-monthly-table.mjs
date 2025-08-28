import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

try {
  const connection = await mysql.createConnection(dbConfig);
  
  console.log('🔄 Updating patient_monthly_records table structure...');
  
  // Add the missing carry forward columns
  await connection.execute(`
    ALTER TABLE patient_monthly_records 
    ADD COLUMN IF NOT EXISTS carry_forward_from_previous DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS carry_forward_to_next DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS net_balance DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'completed', 'partial') DEFAULT 'pending'
  `);
  
  console.log('✅ Table structure updated successfully');
  
  console.log('\n📊 Updated table structure:');
  const [rows] = await connection.execute('DESCRIBE patient_monthly_records');
  console.table(rows);
  
  await connection.end();
} catch (error) {
  console.error('❌ Error:', error.message);
}
