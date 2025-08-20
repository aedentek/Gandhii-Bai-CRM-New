import db from './server/db/config.js';

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    const [tables] = await db.query("SHOW TABLES LIKE 'doctor_salary_history'");
    console.log('doctor_salary_history table exists:', tables.length > 0);
    
    const [tables2] = await db.query("SHOW TABLES LIKE 'doctor_monthly_salary'");
    console.log('doctor_monthly_salary table exists:', tables2.length > 0);
    
    if (tables.length > 0) {
      const [cols] = await db.query('DESCRIBE doctor_salary_history');
      console.log('doctor_salary_history columns:', cols.map(c => c.Field));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTables();
