const mysql = require('mysql2/promise');

async function checkCarryForwardTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    // Check if doctor_monthly_salary table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'doctor_monthly_salary'");
    console.log('=== TABLE CHECK ===');
    console.log('doctor_monthly_salary exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check structure
      const [structure] = await connection.execute('DESCRIBE doctor_monthly_salary');
      console.log('\nTable Structure:');
      structure.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
      
      // Check data
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM doctor_monthly_salary');
      console.log(`\nTotal records: ${rows[0].count}`);
      
      if (rows[0].count > 0) {
        const [sample] = await connection.execute('SELECT * FROM doctor_monthly_salary LIMIT 3');
        console.log('\nSample data:');
        sample.forEach((row, i) => console.log(`${i+1}.`, row));
      }
    } else {
      console.log('\n❌ doctor_monthly_salary table does not exist!');
      console.log('This is why carry forward is not showing data.');
      
      // Let's check what salary-related tables we have
      const [allTables] = await connection.execute("SHOW TABLES LIKE '%salary%'");
      console.log('\nAvailable salary tables:');
      allTables.forEach(table => console.log(`- ${Object.values(table)[0]}`));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkCarryForwardTables();
