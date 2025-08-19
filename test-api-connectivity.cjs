const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API connectivity...');
    
    // Test GET
    const getResponse = await axios.get('http://localhost:4000/api/roles');
    console.log('✅ GET /api/roles works, got', getResponse.data.length, 'roles');
    
    // Test POST
    const postData = {
      name: `API Test Role ${Date.now()}`,
      description: 'Testing API connectivity',
      permissions: ['dashboard', 'add-patient', 'patient-list'],
      status: 'active'
    };
    
    console.log('📤 Sending POST with data:', JSON.stringify(postData, null, 2));
    
    const postResponse = await axios.post('http://localhost:4000/api/roles', postData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ POST /api/roles response:', postResponse.data);
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAPI();
