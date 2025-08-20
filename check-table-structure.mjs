import db from './server/db/config.js';

async function checkTableStructure() {
  try {
    console.log('📋 Checking doctor_salary_settlements table structure...');
    
    // Check if table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'doctor_salary_settlements'");
    
    if (tables.length === 0) {
      console.log('❌ Table doctor_salary_settlements does not exist!');
      console.log('🔧 Creating table...');
      
      const createTableSQL = `
        CREATE TABLE doctor_salary_settlements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          doctor_id VARCHAR(20) NOT NULL,
          doctor_name VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          type VARCHAR(50) DEFAULT 'salary',
          payment_date DATE NOT NULL,
          payment_mode VARCHAR(50) NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await db.query(createTableSQL);
      console.log('✅ Table created successfully!');
    } else {
      console.log('✅ Table exists');
    }
    
    // Show table structure
    const [columns] = await db.query('DESCRIBE doctor_salary_settlements');
    console.log('📋 Current table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key} ${col.Default || ''} ${col.Extra}`);
    });
    
    // Check if doctor_name column exists
    const hasName = columns.some(col => col.Field === 'doctor_name');
    
    if (!hasName) {
      console.log('🔧 Adding doctor_name column...');
      await db.query('ALTER TABLE doctor_salary_settlements ADD COLUMN doctor_name VARCHAR(255) NOT NULL AFTER doctor_id');
      console.log('✅ doctor_name column added!');
    } else {
      console.log('✅ doctor_name column already exists');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

checkTableStructure();
