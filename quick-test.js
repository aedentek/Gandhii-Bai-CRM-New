const http = require('http');

console.log('🚀 Testing Save Monthly Records API...');

const postData = JSON.stringify({
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
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', body);
    try {
      const data = JSON.parse(body);
      console.log('Parsed response:', data);
    } catch (e) {
      console.log('Could not parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

console.log('Request sent!');
