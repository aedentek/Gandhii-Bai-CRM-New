// Test script to check if move-patient-files API is working
async function testMoveFiles() {
  console.log('🧪 Testing move-patient-files API...');
  
  // Use the files visible in temp folder from the screenshot
  const testData = {
    patientId: 'P0101',
    tempPaths: {
      photo: 'Photos/patient Admission/temp/general_1755334459030.jpg'
    }
  };
  
  try {
    const response = await fetch('http://localhost:4000/api/patients/move-patient-files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Move files API works!');
      console.log('📂 New paths:', result.newPaths);
    } else {
      console.log('❌ Move files API failed:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', testMoveFiles);
