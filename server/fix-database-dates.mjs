import db from './db/config.js';

async function fixDatabaseDates() {
  try {
    console.log('🔧 Starting database date fix...');
    
    // Fix NULL dates
    console.log('1. Updating 0000-00-00 admission dates to NULL...');
    const [result1] = await db.query(`
      UPDATE patients 
      SET admissionDate = NULL 
      WHERE admissionDate = '0000-00-00' OR admissionDate = ''
    `);
    console.log(`✅ Updated ${result1.affectedRows} admission date records`);
    
    console.log('2. Updating 0000-00-00 birth dates to NULL...');
    const [result2] = await db.query(`
      UPDATE patients 
      SET dateOfBirth = NULL 
      WHERE dateOfBirth = '0000-00-00' OR dateOfBirth = ''
    `);
    console.log(`✅ Updated ${result2.affectedRows} birth date records`);
    
    // Show fixed data
    console.log('3. Checking updated records...');
    const [patients] = await db.query(`
      SELECT id, patient_id, name, admissionDate, dateOfBirth 
      FROM patients 
      ORDER BY id LIMIT 10
    `);
    
    console.log('📋 Updated patient dates:');
    patients.forEach(p => {
      console.log(`  ${p.patient_id}: admission=${p.admissionDate || 'NULL'}, birth=${p.dateOfBirth || 'NULL'}`);
    });
    
    console.log('✅ Database date fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database dates:', error);
  } finally {
    process.exit(0);
  }
}

fixDatabaseDates();
