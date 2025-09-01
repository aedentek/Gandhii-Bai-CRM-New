// Test frontend data loading for Other Fees
console.log('🔄 Testing frontend Other Fees display...');

// Navigate to the patient payment fees page and check console
if (window.location.href.includes(window.location.hostname)) {
  console.log('✅ On frontend, checking for patient data...');
  
  // Check if patients data is available in the window or localStorage
  setTimeout(() => {
    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    console.log('📊 Patients in localStorage:', patients.length);
    
    if (patients.length > 0) {
      console.log('🔍 Sample patient data:');
      const samplePatient = patients[0];
      console.log('Patient:', samplePatient.name);
      console.log('Other Fees:', samplePatient.otherFees);
      console.log('Blood Test:', samplePatient.bloodTest);
      console.log('Pickup Charge:', samplePatient.pickupCharge);
      console.log('Full patient object:', samplePatient);
    }
  }, 2000);
} else {
  console.log('❌ Not on frontend');
}
