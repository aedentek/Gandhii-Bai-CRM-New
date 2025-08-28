import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

try {
  const connection = await mysql.createConnection(dbConfig);
  
  console.log('🧪 Testing carry forward functionality...');
  
  // First, let's see current patient data
  console.log('\n📊 Current patients with fees:');
  const [patients] = await connection.execute(`
    SELECT 
      id,
      CONCAT('P', LPAD(id, 4, '0')) as patient_id,
      name,
      fees,
      payAmount,
      balance,
      admissionDate
    FROM patients 
    WHERE status = 'Active' AND fees > 0
    LIMIT 5
  `);
  console.table(patients);
  
  // Check if there are any existing monthly records
  console.log('\n📊 Existing monthly records:');
  const [monthlyRecords] = await connection.execute(`
    SELECT * FROM patient_monthly_records LIMIT 5
  `);
  console.table(monthlyRecords);
  
  await connection.end();
  console.log('✅ Test completed');
} catch (error) {
  console.error('❌ Error:', error.message);
}
