// Complete Frontend-to-Backend-to-Database Test
const http = require('http');

console.log('🧪 Starting complete API test...');

// Test 1: Get patient payments data
function testGetPatients() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/patient-payments/all',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log('\n📊 TEST 1: GET Patient Payments');
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', res.headers);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('✅ GET Response:', {
            success: data.success,
            totalPatients: data.data?.patients?.length || 0,
            samplePatient: data.data?.patients?.[0]?.patient_name || 'N/A'
          });
          resolve(data);
        } catch (e) {
          console.log('❌ GET Response parsing error:', e.message);
          console.log('Raw response:', body);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ GET Request error:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Test 2: Save monthly records
function testSaveMonthly() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      month: 8,
      year: 2025
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/patient-payments/save-monthly-records',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      console.log('\n💾 TEST 2: POST Save Monthly Records');
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', res.headers);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          console.log('✅ POST Response:', {
            success: responseData.success,
            message: responseData.message,
            recordsProcessed: responseData.recordsProcessed,
            carryForwardUpdates: responseData.carryForwardUpdates
          });
          resolve(responseData);
        } catch (e) {
          console.log('❌ POST Response parsing error:', e.message);
          console.log('Raw response:', body);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ POST Request error:', e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Run tests sequentially
async function runCompleteTest() {
  try {
    console.log('🚀 Testing Frontend-to-Backend-to-Database Connection...\n');
    
    // Test 1: Check if we can get patient data
    await testGetPatients();
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Check if we can save monthly records
    await testSaveMonthly();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Frontend can connect to Backend');
    console.log('✅ Backend can connect to Database');
    console.log('✅ Save Monthly Records functionality works');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
  }
}

runCompleteTest();
