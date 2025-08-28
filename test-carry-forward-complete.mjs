import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

try {
  const connection = await mysql.createConnection(dbConfig);
  
  console.log('🎯 Creating test data for carry forward...');
  
  // First, let's insert some test monthly records to verify carry forward works
  await connection.execute(`
    INSERT INTO patient_monthly_records 
    (patient_id, month, year, patient_fees, other_fees, total_amount, amount_paid, 
     carry_forward_from_previous, carry_forward_to_next, net_balance, payment_status)
    VALUES 
    ('P0001', 7, 2025, 15000, 0, 15000, 5000, 0, 10000, 10000, 'pending'),
    ('P0002', 7, 2025, 20000, 0, 20000, 8000, 0, 12000, 12000, 'pending')
  `);
  
  console.log('✅ Test data inserted successfully');
  
  // Now test the API endpoint directly
  console.log('\n🧪 Testing auto-carry-forward API call...');
  
  const apiResponse = await fetch('http://localhost:4000/api/patient-payments/auto-carry-forward/8/2025', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (apiResponse.ok) {
    const result = await apiResponse.json();
    console.log('✅ API Response:', result);
  } else {
    console.log('❌ API Error:', apiResponse.status, apiResponse.statusText);
  }
  
  // Check the results
  console.log('\n📊 Checking created records:');
  const [records] = await connection.execute(`
    SELECT * FROM patient_monthly_records 
    WHERE month = 8 AND year = 2025
    ORDER BY patient_id
  `);
  console.table(records);
  
  await connection.end();
  console.log('🎉 Carry forward test completed successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
}
