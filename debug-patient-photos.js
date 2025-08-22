// Debug script to check patient photo data in database
import mysql from 'mysql2/promise';

// Database connection
const db = await mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

try {
  console.log('🔍 Checking patient photo data in database...');
  
  // Get all patients with their photo and document fields
  const [patients] = await db.query(`
    SELECT id, name, photo, patientAadhar, patientPan, attenderAadhar, attenderPan 
    FROM patients 
    WHERE is_deleted = FALSE 
    ORDER BY id DESC 
    LIMIT 10
  `);
  
  console.log(`📋 Found ${patients.length} patients`);
  
  patients.forEach(patient => {
    console.log(`\n👤 Patient: ${patient.name} (${patient.id})`);
    console.log(`📸 Photo: ${patient.photo || 'No photo'}`);
    console.log(`📄 Patient Aadhar: ${patient.patientAadhar || 'No document'}`);
    console.log(`📄 Patient PAN: ${patient.patientPan || 'No document'}`);
    console.log(`📄 Attender Aadhar: ${patient.attenderAadhar || 'No document'}`);
    console.log(`📄 Attender PAN: ${patient.attenderPan || 'No document'}`);
    
    // Check if files exist for this patient
    const photoPath = patient.photo;
    if (photoPath && photoPath.includes('Photos/patient Admission/')) {
      console.log(`✅ Photo path looks correct: ${photoPath}`);
    } else if (photoPath) {
      console.log(`⚠️ Photo path format unexpected: ${photoPath}`);
    }
  });
  
} catch (error) {
  console.error('❌ Database error:', error);
} finally {
  await db.end();
  process.exit();
}
