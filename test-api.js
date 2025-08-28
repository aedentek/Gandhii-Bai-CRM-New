console.log('Testing API...');
setTimeout(() => {
  const http = require('http');
  
  const req = http.get('http://localhost:4000/api/patient-payments/all?page=1&limit=10', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      process.exit(0);
    });
  });
  
  req.on('error', err => {
    console.error('Error:', err);
    process.exit(1);
  });
  
  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 5000);
}, 1000);
