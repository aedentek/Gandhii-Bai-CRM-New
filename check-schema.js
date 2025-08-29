import mysql from 'mysql2/promise';

async function checkSchema() {
  try {
    const connection = await mysql.createConnection({
      host: 'srv1639.hstgr.io',
      user: 'u745362362_crmusername',
      password: 'Aedentek@123#',
      database: 'u745362362_crm'
    });
    
    const [rows] = await connection.execute('DESCRIBE patient_monthly_records');
    console.log('Patient Monthly Records Table Schema:');
    rows.forEach(row => console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(not null)'} ${row.Default ? `default: ${row.Default}` : ''}`));
    
    // Also check a sample record
    const [sample] = await connection.execute('SELECT * FROM patient_monthly_records LIMIT 1');
    console.log('\nSample Record:', sample[0]);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
