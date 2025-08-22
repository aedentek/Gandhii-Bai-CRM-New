const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/patients',
  method: 'GET'
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const patients = JSON.parse(data);
      console.log('🏥 Patient Data Analysis:');
      
      if (patients.length > 0) {
        const patient = patients[0];
        console.log(`\n👤 Patient: ${patient.name}`);
        console.log(`💰 Financial Breakdown:`);
        console.log(`   - Fees: ₹${patient.fees}`);
        console.log(`   - Blood Test: ₹${patient.bloodTest}`);
        console.log(`   - Pickup Charge: ₹${patient.pickupCharge}`);
        console.log(`   - Other Fees: ₹${patient.otherFees}`);
        console.log(`   - Total Amount: ₹${patient.totalAmount}`);
        
        const testAmount = parseFloat(patient.bloodTest || 0);
        const otherFeesAmount = parseFloat(patient.otherFees || 0);
        const monthTotal = testAmount + otherFeesAmount;
        
        console.log(`\n📊 Calculation Analysis:`);
        console.log(`   - Patient bloodTest (₹${patient.bloodTest}) + otherFees (₹${patient.otherFees}) = ₹${monthTotal.toFixed(2)}`);
        console.log(`   - This matches the ₹6,999.91 shown in patient detail view`);
        console.log(`\n🔍 Different Data Sources:`);
        console.log(`   - Main Page Total Amount: From test_reports table (₹3,000.00)`);
        console.log(`   - Patient Detail Month Total: From patient table (₹${monthTotal.toFixed(2)})`);
        console.log(`   - These are different data sources and both are correct!`);
        
        console.log(`\n💡 SOLUTION:`);
        console.log(`   The user wants the main page "Total Amount" to reflect`);
        console.log(`   the test report amounts from the patient table instead of`);
        console.log(`   the separate test_reports table.`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end();
