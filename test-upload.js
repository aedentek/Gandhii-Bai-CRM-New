// Test upload functionality
const http = require('http');

console.log('🧪 Testing upload endpoint accessibility...');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/upload-patient-file',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

const req = http.request(options, (res) => {
  console.log('✅ Upload endpoint status:', res.statusCode);
  console.log('📋 Response headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response body:', data);
  });
});

req.on('error', (err) => {
  console.log('❌ Connection error:', err.message);
});

// Send empty request to test endpoint
req.end();
