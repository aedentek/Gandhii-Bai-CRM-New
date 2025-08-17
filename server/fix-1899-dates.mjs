import db from './db/config.js';

try {
  console.log('🔗 Connecting to database...');
  
  // Check current 1899 dates
  const [before] = await db.query(`
    SELECT COUNT(*) as count 
    FROM patients 
    WHERE (admissionDate = '1899-11-30' OR dateOfBirth = '1899-11-30') 
    AND is_deleted = FALSE
  `);
  
  console.log(`📊 Found ${before[0].count} patients with 1899 default dates`);
  
  if (before[0].count > 0) {
    console.log('🔧 Updating 1899 dates to NULL...');
    
    // Update admission dates
    const [admissionResult] = await db.query(`
      UPDATE patients 
      SET admissionDate = NULL 
      WHERE admissionDate = '1899-11-30' AND is_deleted = FALSE
    `);
    
    // Update birth dates
    const [birthResult] = await db.query(`
      UPDATE patients 
      SET dateOfBirth = NULL 
      WHERE dateOfBirth = '1899-11-30' AND is_deleted = FALSE
    `);
    
    console.log(`✅ Updated ${admissionResult.affectedRows} admission dates`);
    console.log(`✅ Updated ${birthResult.affectedRows} birth dates`);
    
    // Verify the fix
    const [after] = await db.query(`
      SELECT COUNT(*) as count 
      FROM patients 
      WHERE (admissionDate = '1899-11-30' OR dateOfBirth = '1899-11-30') 
      AND is_deleted = FALSE
    `);
    
    console.log(`📊 After cleanup: ${after[0].count} patients still have 1899 dates`);
    
    if (after[0].count === 0) {
      console.log('🎉 All 1899 default dates have been cleaned up!');
    }
  } else {
    console.log('✅ No 1899 dates found - database is already clean');
  }
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
