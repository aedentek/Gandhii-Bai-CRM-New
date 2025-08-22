// Quick database check script
import mysql from 'mysql2/promise';

const db = await mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
});

try {
  console.log('🔍 Checking patients with P0113...');
  
  const [rows] = await db.query(`
    SELECT id, patient_id, name, photo, patientAadhar, patientPan, attenderAadhar, attenderPan 
    FROM patients 
    WHERE id = 113 OR patient_id = 'P0113' OR id = 'P0113'
    AND is_deleted = FALSE
  `);
  
  console.log('Results:', rows);
  
  if (rows.length === 0) {
    console.log('❌ No patient found with P0113');
    
    // Check all patients to see what IDs exist
    const [allPatients] = await db.query(`
      SELECT id, patient_id, name 
      FROM patients 
      WHERE is_deleted = FALSE 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('Last 5 patients:', allPatients);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await db.end();
  process.exit();
}
