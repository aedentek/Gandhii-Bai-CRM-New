import db from './db/config.js';

try {
  console.log('🔍 Checking raw date values in database...');
  
  const [patients] = await db.query(`
    SELECT id, name, 
           admissionDate, 
           dateOfBirth,
           DATE_FORMAT(admissionDate, '%Y-%m-%d') as admission_formatted,
           DATE_FORMAT(dateOfBirth, '%Y-%m-%d') as birth_formatted
    FROM patients 
    WHERE is_deleted = FALSE 
    LIMIT 5
  `);
  
  patients.forEach((patient, idx) => {
    console.log(`\nPatient ${idx + 1}:`);
    console.log(`  ID: ${patient.id}`);
    console.log(`  Name: ${patient.name}`);
    console.log(`  Raw admissionDate: ${patient.admissionDate}`);
    console.log(`  Raw dateOfBirth: ${patient.dateOfBirth}`);
    console.log(`  Formatted admission: ${patient.admission_formatted}`);
    console.log(`  Formatted birth: ${patient.birth_formatted}`);
  });
  
  // Also check for any NULL dates
  const [nullCheck] = await db.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN admissionDate IS NULL THEN 1 ELSE 0 END) as null_admission,
      SUM(CASE WHEN dateOfBirth IS NULL THEN 1 ELSE 0 END) as null_birth
    FROM patients 
    WHERE is_deleted = FALSE
  `);
  
  console.log('\n📊 Date null statistics:');
  console.log(`  Total patients: ${nullCheck[0].total}`);
  console.log(`  NULL admission dates: ${nullCheck[0].null_admission}`);
  console.log(`  NULL birth dates: ${nullCheck[0].null_birth}`);
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
