import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

try {
  const connection = await mysql.createConnection(dbConfig);
  
  console.log('🔍 Checking if previous month data exists for carry forward...');
  console.log('=====================================');
  
  // Check current patients
  console.log('\n1. 📊 Current Active Patients:');
  const [patients] = await connection.execute(`
    SELECT 
      id,
      CONCAT('P', LPAD(id, 4, '0')) as patient_id,
      name,
      fees,
      payAmount,
      balance,
      admissionDate
    FROM patients 
    WHERE status = 'Active' AND fees > 0
    LIMIT 5
  `);
  console.table(patients);
  
  // Check if ANY monthly records exist
  console.log('\n2. 📋 Existing Monthly Records in Database:');
  const [monthlyRecords] = await connection.execute(`
    SELECT 
      patient_id,
      month,
      year,
      patient_fees,
      amount_paid,
      carry_forward_to_next,
      net_balance,
      payment_status
    FROM patient_monthly_records 
    ORDER BY year DESC, month DESC, patient_id
    LIMIT 10
  `);
  
  if (monthlyRecords.length === 0) {
    console.log('❌ NO MONTHLY RECORDS FOUND!');
    console.log('   This explains why carry forward is not working.');
    console.log('   We need to save monthly records first before carry forward can happen.');
  } else {
    console.table(monthlyRecords);
  }
  
  console.log('\n3. 🗓️ Checking Records by Month:');
  const [byMonth] = await connection.execute(`
    SELECT 
      month,
      year,
      COUNT(*) as patient_count,
      SUM(carry_forward_to_next) as total_carry_forward
    FROM patient_monthly_records 
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `);
  console.table(byMonth);
  
  // Check last 3 months specifically
  console.log('\n4. 🎯 Carry Forward Chain Check:');
  const currentDate = new Date();
  for (let i = 2; i >= 0; i--) {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = checkDate.getMonth() + 1;
    const year = checkDate.getFullYear();
    
    const [monthData] = await connection.execute(`
      SELECT COUNT(*) as count, SUM(COALESCE(carry_forward_to_next, 0)) as total_cf
      FROM patient_monthly_records 
      WHERE month = ? AND year = ?
    `, [month, year]);
    
    console.log(`${year}-${month.toString().padStart(2, '0')}: ${monthData[0].count} records, ₹${monthData[0].total_cf || 0} carry forward`);
  }
  
  await connection.end();
  
  console.log('\n💡 CONCLUSION:');
  if (monthlyRecords.length === 0) {
    console.log('❌ No monthly records exist - carry forward cannot work');
    console.log('✅ SOLUTION: Use "Save Records" button first to create monthly data');
  } else {
    console.log('✅ Monthly records exist - carry forward should work');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
