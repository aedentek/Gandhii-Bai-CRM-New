const mysql = require('mysql2/promise');

async function checkStaffSchema() {
  const connection = await mysql.createConnection({
    host: 'srv1639.hstgr.io',
    user: 'u745362362_crmusername',
    password: 'Aedentek@123#',
    database: 'u745362362_crm'
  });

  try {
    const [rows] = await connection.query('DESCRIBE staff');
    console.log('📊 Staff table columns:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type}) ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Default ? 'DEFAULT ' + row.Default : ''}`);
    });
    
    // Also check sample data
    console.log('\n📊 Sample staff data:');
    const [data] = await connection.query('SELECT id, name, role, department, join_date, created_at FROM staff LIMIT 1');
    console.log(data[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStaffSchema();
