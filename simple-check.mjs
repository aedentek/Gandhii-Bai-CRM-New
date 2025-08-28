import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

(async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Simple count check
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM patient_monthly_records');
    console.log('Monthly Records Count:', count[0].total);
    
    if (count[0].total === 0) {
      console.log('❌ NO MONTHLY RECORDS - This is why carry forward is not working!');
      console.log('✅ Need to save monthly records first using "Save Records" button');
    } else {
      console.log('✅ Monthly records exist');
      const [records] = await connection.execute('SELECT * FROM patient_monthly_records LIMIT 5');
      console.table(records);
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
