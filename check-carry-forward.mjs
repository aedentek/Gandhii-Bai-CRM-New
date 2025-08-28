import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

try {
  const connection = await mysql.createConnection(dbConfig);
  
  console.log('📊 Checking patient_monthly_records table structure:');
  const [rows] = await connection.execute('DESCRIBE patient_monthly_records');
  console.table(rows);
  
  console.log('\n📊 Sample records from patient_monthly_records:');
  const [records] = await connection.execute('SELECT * FROM patient_monthly_records LIMIT 5');
  console.table(records);
  
  console.log('\n📊 Count of records in patient_monthly_records:');
  const [count] = await connection.execute('SELECT COUNT(*) as total FROM patient_monthly_records');
  console.table(count);
  
  await connection.end();
  console.log('✅ Database check completed');
} catch (error) {
  console.error('❌ Error:', error.message);
}
