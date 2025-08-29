const axios = require('axios');

async function testCarryForward() {
  try {
    console.log('Testing carry forward endpoint...');
    
    const response = await axios.post('http://localhost:4000/api/patient-payments/save-monthly-records', {
      month: 'December',
      year: 2024
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testCarryForward();
