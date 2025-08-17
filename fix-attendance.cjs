// IMMEDIATE FIX FOR ATTENDANCE ISSUE

// The problem: patient_id is NULL in database, should be "P0100"
// The solution: Update the record via direct SQL

const mysql = require('mysql2/promise');

async function fixAttendance() {
  try {
    // Use the same connection as the backend
    const db = await mysql.createConnection({
      host: 'srv1639.hstgr.io',
      user: 'u745362362_crmusername',
      password: 'Aedentek@123#',
      database: 'u745362362_crm'
    });
    
    console.log('✅ Connected to database');
    
    // Update the record with NULL patient_id to have P0100
    console.log('🔧 Fixing attendance record...');
    const [result] = await db.query(
      'UPDATE patient_attendance SET patient_id = ?, patient_name = ? WHERE id = ?',
      ['P0100', 'SABARISH T', 434]
    );
    
    console.log('✅ Updated rows:', result.affectedRows);
    
    // Verify the fix
    const [rows] = await db.query('SELECT * FROM patient_attendance WHERE id = 434');
    console.log('📊 Updated record:', rows[0]);
    
    await db.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAttendance();
