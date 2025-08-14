const http = require('http');

// Test the health endpoint first
console.log('Testing health endpoint...');
http.get('http://localhost:4000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Health response:', data);
    testMoveEndpoint();
  });
}).on('error', err => {
  console.error('Health error:', err.message);
});

function testMoveEndpoint() {
  console.log('\nTesting move-patient-files endpoint...');
  
  const postData = JSON.stringify({
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
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Move response:', data);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}
