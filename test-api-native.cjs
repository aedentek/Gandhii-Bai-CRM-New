const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('Testing API connectivity...');
    
    // Test GET
    const getResponse = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/roles',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ GET /api/roles - Status:', getResponse.status, '- Got', getResponse.data.length, 'roles');
    
    // Test POST
    const postData = {
      name: `API Test Role ${Date.now()}`,
      description: 'Testing API connectivity',
      permissions: ['dashboard', 'add-patient', 'patient-list'],
      status: 'active'
    };
    
    console.log('📤 Sending POST with data:', JSON.stringify(postData, null, 2));
    
    const postResponse = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/roles',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(postData))
      }
    }, postData);
    
    console.log('✅ POST /api/roles - Status:', postResponse.status);
    console.log('📥 Response:', postResponse.data);
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

testAPI();
