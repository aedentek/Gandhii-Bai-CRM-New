// Simple test to verify the move-patient-files API endpoint
const http = require('http');

const data = JSON.stringify({
  patientId: 'P0001',
  tempPaths: {
    photo: 'Photos/Doctor Admission/temp/test.jpg'
  }
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/move-patient-files',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
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
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
