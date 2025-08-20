import db from './server/db/config.js';

async function addDoctorNameColumn() {
  try {
    console.log('🔧 Adding doctor_name column to doctor_salary_settlements...');
    
    // Add the column (this will fail if it already exists, which is fine)
    try {
      await db.query('ALTER TABLE doctor_salary_settlements ADD COLUMN doctor_name VARCHAR(255) AFTER doctor_id');
      console.log('✅ Successfully added doctor_name column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  doctor_name column already exists');
      } else {
        throw err;
      }
    }
    
    // Update existing records with doctor names
    console.log('🔄 Updating existing records with doctor names...');
    const updateQuery = `
      UPDATE doctor_salary_settlements dss 
      JOIN doctors d ON dss.doctor_id = d.id 
      SET dss.doctor_name = d.name 
      WHERE dss.doctor_name IS NULL OR dss.doctor_name = ''
    `;
    
    const [result] = await db.query(updateQuery);
    console.log(`✅ Updated ${result.affectedRows} records with doctor names`);
    
    // Show sample data
    console.log('📋 Sample data:');
    const [sample] = await db.query('SELECT doctor_id, doctor_name, amount, payment_date FROM doctor_salary_settlements LIMIT 3');
    console.table(sample);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addDoctorNameColumn();
