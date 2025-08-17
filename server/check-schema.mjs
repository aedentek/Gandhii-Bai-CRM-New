import db from './db/config.js';

try {
  console.log('🔗 Connecting to database...');
  const [columns] = await db.query('DESCRIBE patients');
  
  console.log('\n📋 Patient table schema:');
  console.log('=====================================');
  
  columns.forEach(col => {
    if (col.Field.toLowerCase().includes('date') || 
        col.Field.toLowerCase().includes('birth') || 
        col.Field.toLowerCase().includes('admission')) {
      console.log(`📅 ${col.Field.padEnd(20)} → ${col.Type.padEnd(15)} (${col.Null})`);
    } else {
      console.log(`   ${col.Field.padEnd(20)} → ${col.Type.padEnd(15)} (${col.Null})`);
    }
  });
  
  console.log('\n🔍 Checking current date values in first 3 patients...');
  const [patients] = await db.query('SELECT id, name, admissionDate, dateOfBirth FROM patients WHERE is_deleted = FALSE LIMIT 3');
  
  patients.forEach((patient, idx) => {
    console.log(`\nPatient ${idx + 1}:`);
    console.log(`  ID: ${patient.id}`);
    console.log(`  Name: ${patient.name}`);
    console.log(`  admissionDate: ${patient.admissionDate} (${typeof patient.admissionDate})`);
    console.log(`  dateOfBirth: ${patient.dateOfBirth} (${typeof patient.dateOfBirth})`);
  });
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
