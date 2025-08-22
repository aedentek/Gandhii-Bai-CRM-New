// Fix duplicated Photos/Photos/ paths in database
const mysql = require('mysql2/promise');

async function fixDuplicatedPhotoPaths() {
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
    console.log('🔧 Fixing duplicated Photos/Photos/ paths in database...\n');
    
    // Check for patients with duplicated paths
    const [patients] = await db.query(`
      SELECT id, name, photo 
      FROM patients 
      WHERE photo LIKE '%Photos/Photos/%'
      ORDER BY id
    `);
    
    console.log(`📋 Found ${patients.length} patients with duplicated paths:\n`);
    
    if (patients.length === 0) {
      console.log('✅ No duplicated paths found! Database is clean.');
      return;
    }
    
    // Fix each duplicated path
    for (const patient of patients) {
      const originalPath = patient.photo;
      const fixedPath = originalPath.replace('Photos/Photos/', 'Photos/');
      
      console.log(`👤 Patient: ${patient.name} (ID: ${patient.id})`);
      console.log(`❌ Original path: "${originalPath}"`);
      console.log(`✅ Fixed path:    "${fixedPath}"`);
      
      // Update the database
      const [result] = await db.query(`
        UPDATE patients 
        SET photo = ? 
        WHERE id = ?
      `, [fixedPath, patient.id]);
      
      console.log(`📊 Updated ${result.affectedRows} row(s)`);
      console.log('─'.repeat(60));
    }
    
    console.log(`\n✅ Fixed ${patients.length} duplicated photo paths!`);
    
    // Verify the fixes
    const [verifyPatients] = await db.query(`
      SELECT id, name, photo 
      FROM patients 
      WHERE photo LIKE '%Photos/Photos/%'
    `);
    
    if (verifyPatients.length === 0) {
      console.log('✅ Verification passed: No more duplicated paths found!');
    } else {
      console.log(`❌ Verification failed: Still found ${verifyPatients.length} duplicated paths`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

fixDuplicatedPhotoPaths();
