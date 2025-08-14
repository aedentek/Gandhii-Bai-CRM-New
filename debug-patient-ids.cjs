const axios = require('axios');

async function debugPatientIds() {
  try {
  const response = await axios.get(import.meta.env.VITE_API_URL + '/patients');
    console.log('🔍 Debug: Patient IDs in API response:');
    response.data.forEach((p, idx) => {
      console.log(`${idx + 1}. Name: ${p.name}, ID: ${p.id}, Type: ${typeof p.id}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugPatientIds();
