const mysql = require('mysql2/promise');

async function verifyCarryForwardSetup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    console.log('🔍 VERIFYING CARRY FORWARD SETUP\n');
    
    // Test the exact query that the API uses
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const [apiResults] = await connection.execute(`
      SELECT 
        d.id,
        d.name,
        d.salary,
        COALESCE(
          (SELECT carry_forward_from_previous 
           FROM doctor_monthly_salary 
           WHERE doctor_id = d.id 
           AND month = ? 
           AND year = ?
           ORDER BY id DESC 
           LIMIT 1
          ), 0) as carry_forward
      FROM doctors d
      WHERE d.status = 'Active'
      ORDER BY d.name ASC
      LIMIT 5
    `, [currentMonth, currentYear]);
    
    console.log('API Query Results (first 5 doctors):');
    apiResults.forEach((doctor, i) => {
      console.log(`${i+1}. ${doctor.name}`);
      console.log(`   Base Salary: ₹${parseFloat(doctor.salary || 0).toLocaleString()}`);
      console.log(`   Carry Forward: ₹${parseFloat(doctor.carry_forward || 0).toLocaleString()}`);
      console.log(`   Total: ₹${(parseFloat(doctor.salary || 0) + parseFloat(doctor.carry_forward || 0)).toLocaleString()}`);
      console.log('');
    });
    
    // Count how many doctors have carry forward amounts
    const [carryForwardCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM doctor_monthly_salary 
      WHERE month = ? AND year = ? AND carry_forward_from_previous > 0
    `, [currentMonth, currentYear]);
    
    console.log(`✅ ${carryForwardCount[0].count} doctors have carry forward amounts for ${currentMonth}/${currentYear}`);
    
    if (carryForwardCount[0].count > 0) {
      console.log('🎉 Carry forward is working! Check the Doctor Salary page.');
    } else {
      console.log('⚠️  No carry forward data found. Running setup...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

verifyCarryForwardSetup();
