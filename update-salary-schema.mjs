import db from './server/db/config.js';

async function updateTableSchema() {
  try {
    console.log('📋 Checking current table structure...');
    const [cols] = await db.query('DESCRIBE doctor_salary_settlements');
    console.log('Current columns:');
    cols.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Check if name column already exists
    const hasName = cols.some(col => col.Field === 'doctor_name');
    
    if (!hasName) {
      console.log('🔧 Adding doctor_name column...');
      await db.query('ALTER TABLE doctor_salary_settlements ADD COLUMN doctor_name VARCHAR(255) AFTER doctor_id');
      console.log('✅ Successfully added doctor_name column');
    } else {
      console.log('✅ doctor_name column already exists');
    }
    
    // Show updated structure
    console.log('\n📋 Updated table structure:');
    const [newCols] = await db.query('DESCRIBE doctor_salary_settlements');
    newCols.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateTableSchema();
