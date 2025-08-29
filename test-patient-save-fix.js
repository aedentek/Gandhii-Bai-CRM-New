import fetch from 'node-fetch';

async function testPatientMonthlySave() {
  try {
    console.log('🔥 Testing the FIXED patient monthly records save for May 2025...');
    
    const response = await fetch('http://localhost:4000/api/patient-payments/save-monthly-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        month: 5,
        year: 2025
      })
    });

    const result = await response.json();
    console.log('Response:', result);
    
    if (result.success) {
      console.log(`✅ Successfully saved ${result.recordsProcessed} patient records for May 2025`);
      console.log(`💰 ${result.carryForwardUpdates} patients have balances carrying forward`);
    } else {
      console.error('❌ Failed to save records:', result.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPatientMonthlySave();
