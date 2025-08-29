import http from 'http';

console.log('🔥 Testing the FIXED patient monthly records save for May 2025...');

const postData = JSON.stringify({
  month: 5,
  year: 2025
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/patient-payments/save-monthly-records',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Response:', result);
      
      if (result.success) {
        console.log(`✅ Successfully saved ${result.recordsProcessed} patient records for May 2025`);
        console.log(`💰 ${result.carryForwardUpdates} patients have balances carrying forward`);
      } else {
        console.error('❌ Failed to save records:', result.message);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
