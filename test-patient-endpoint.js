// Simple test for the Patient Payment carry forward endpoint
fetch('http://localhost:4000/api/patient-payments/save-monthly-records', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    month: 12,
    year: 2024
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Error:', error);
});
