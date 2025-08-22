const http = require('http');

// Test the API endpoint directly
const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/test-reports',
  method: 'GET'
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('📊 Test Reports API Response:');
      console.log('Status:', res.statusCode);
      console.log('Success:', result.success);
      console.log('Count:', result.count);
      console.log('Data length:', result.data?.length || 0);
      
      if (result.data && result.data.length > 0) {
        console.log('\n📋 Test Reports in Database:');
        
        result.data.forEach((report, index) => {
          console.log(`\n${index + 1}. Test Report ID: ${report.id}`);
          console.log(`   Patient ID: ${report.patient_id}`);
          console.log(`   Patient Name: ${report.patient_name}`);
          console.log(`   Test Type: ${report.test_type}`);
          console.log(`   Amount: ₹${report.amount}`);
          console.log(`   Date: ${report.test_date}`);
          console.log(`   Status: ${report.status}`);
          console.log(`   Created: ${report.created_at}`);
        });
        
        console.log(`\n💰 Total Amount Calculation:`);
        const totalAmount = result.data.reduce((sum, report) => sum + parseFloat(report.amount), 0);
        console.log(`   Sum of all amounts: ₹${totalAmount.toFixed(2)}`);
        
        console.log(`\n🔍 Analysis:`);
        console.log(`   - Database has ${result.data.length} test report(s)`);
        console.log(`   - Frontend should show ₹${totalAmount.toFixed(2)} as Total Amount`);
        console.log(`   - If frontend shows different amount, there's a filtering/calculation issue`);
        
      } else {
        console.log('\n❌ No test reports found in database');
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('💡 Make sure the backend server is running on port 4000');
});

req.end();
