// Debug script to identify the photo path duplication issue
const mysql = require('mysql2/promise');

async function debugPhotoPaths() {
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
    console.log('🔍 Debugging photo path duplication issue...\n');
    
    // Get recent patients with photos
    const [patients] = await db.query(`
      SELECT id, name, photo 
      FROM patients 
      WHERE photo IS NOT NULL AND photo != "" 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log(`📋 Found ${patients.length} patients with photos:\n`);
    
    patients.forEach(patient => {
      console.log(`👤 Patient: ${patient.name} (ID: ${patient.id})`);
      console.log(`📸 Database Photo Path: "${patient.photo}"`);
      
      // Analyze the path
      if (patient.photo.includes('Photos/Photos/')) {
        console.log('❌ ISSUE DETECTED: Path has duplicate "Photos/" prefix!');
        console.log(`   Expected: "${patient.photo.replace('Photos/Photos/', 'Photos/')}"`);
        console.log(`   Actual: "${patient.photo}"`);
      } else if (patient.photo.startsWith('Photos/patient Admission/')) {
        console.log('✅ Path looks correct');
      } else {
        console.log('⚠️  Unexpected path format');
      }
      console.log('─'.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

debugPhotoPaths();
