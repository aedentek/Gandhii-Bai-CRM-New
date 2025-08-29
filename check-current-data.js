import mysql from 'mysql2/promise';

async function checkCurrentData() {
  try {
    const connection = await mysql.createConnection({
      host: 'srv1639.hstgr.io',
      user: 'u745362362_crmusername',
      password: 'Aedentek@123#',
      database: 'u745362362_crm'
    });
    
    console.log('📋 Current patient_monthly_records data for May 2025:');
    const [records] = await connection.execute(`
      SELECT patient_id, patient_fees, other_fees, total_amount, amount_paid, balance 
      FROM patient_monthly_records 
      WHERE month = 5 AND year = 2025 
      ORDER BY patient_id
    `);
    
    console.log(`Found ${records.length} records:`);
    records.forEach(record => {
      console.log(`- ${record.patient_id}: patient_fees=₹${record.patient_fees}, other_fees=₹${record.other_fees}, total=₹${record.total_amount}, paid=₹${record.amount_paid}, balance=₹${record.balance}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCurrentData();
