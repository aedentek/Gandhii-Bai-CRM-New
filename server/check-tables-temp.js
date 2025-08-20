import db from './db/config.js';

async function checkTables() {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    console.log('📋 Available tables:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    // Check if doctor_monthly_salary table exists
    const doctorMonthlyExists = tables.some(table => Object.values(table)[0] === 'doctor_monthly_salary');
    console.log(`\n📅 doctor_monthly_salary table exists: ${doctorMonthlyExists}`);
    
    // Check doctor_salary_settlements table
    const doctorSalaryExists = tables.some(table => Object.values(table)[0] === 'doctor_salary_settlements');
    console.log(`💰 doctor_salary_settlements table exists: ${doctorSalaryExists}`);
    
    // Check doctors table
    const doctorsExists = tables.some(table => Object.values(table)[0] === 'doctors');
    console.log(`👨‍⚕️ doctors table exists: ${doctorsExists}`);
    
    // If doctors table exists, show its structure
    if (doctorsExists) {
      console.log(`\n📋 Doctors table structure:`);
      const [structure] = await db.execute('DESCRIBE doctors');
      structure.forEach(field => {
        console.log(`  ${field.Field} - ${field.Type} ${field.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
