const http = require('http');

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

console.log('🧪 Testing Patient Payment Save Monthly Records...');
console.log('📤 Request:', JSON.parse(data));

const req = http.request(options, (res) => {
  console.log('✅ Status:', res.statusCode);
  console.log('📋 Headers:', res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response:', responseData);
    try {
      const parsed = JSON.parse(responseData);
      console.log('🎯 Parsed Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('❌ Could not parse as JSON:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(data);
req.end();
