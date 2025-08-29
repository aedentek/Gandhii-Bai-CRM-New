import mysql from 'mysql2/promise';

async function checkDatabase() {
  console.log('Starting database check...');
  try {
    console.log('Creating connection...');
    const connection = await mysql.createConnection({
      host: 'srv1802.hstgr.io',
      user: 'u211697631_crmuser',
      password: 'Aedentek@123#',
      database: 'u211697631_crmdb',
      port: 3306
    });

    console.log('🔍 Checking patient_monthly_records table...');
    
    const [records] = await connection.execute(`
      SELECT patient_id, month, year, patient_fees, other_fees, total_amount, 
             amount_paid, carry_forward_to_next, created_at 
      FROM patient_monthly_records 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('\n📋 Recent monthly records:');
    records.forEach((record, index) => {
      console.log(`${index + 1}. Patient ${record.patient_id} - ${record.month}/${record.year}`);
      console.log(`   Patient Fees: ${record.patient_fees}`);
      console.log(`   Other Fees: ${record.other_fees}`);
      console.log(`   Total Amount: ${record.total_amount}`);
      console.log(`   Amount Paid: ${record.amount_paid}`);
      console.log(`   Carry Forward: ${record.carry_forward_to_next}`);
      console.log(`   Created: ${record.created_at}`);
      console.log('');
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Database check error:', error.message);
  }
}

checkDatabase();
