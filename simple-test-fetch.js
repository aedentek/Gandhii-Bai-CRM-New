console.log('Testing basic fetch...');

async function simpleTest() {
  try {
    console.log('Making request...');
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

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', result);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleTest();
