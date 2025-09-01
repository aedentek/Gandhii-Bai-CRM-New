const fetch = require('node-fetch');

async function testPaymentCalculations() {
  try {
    const API_URL = process.env.VITE_API_URL || 'http://localhost:4000/api';
    console.log('🔍 Testing Payment Calculations...\n');
    
    // Test June 2025 (Patient's joining month)
    console.log('=== JUNE 2025 (Joining Month) ===');
    const juneResponse = await fetch(`${API_URL}/patient-payments/all?month=6&year=2025`);
    const juneData = await juneResponse.json();
    
    if (juneData.patients && juneData.patients.length > 0) {
      const patient = juneData.patients[0];
      console.log(`Patient: ${patient.patient_name} (${patient.patient_id})`);
      console.log(`Admission Date: ${patient.admissionDate}`);
      console.log(`Monthly Fees: ₹${patient.fees}`);
      console.log(`Other Fees (Month-specific): ₹${patient.month_specific_other_fees}`);
      console.log(`Total Amount: ₹${patient.total_amount}`);
      console.log(`Amount Paid: ₹${patient.amount_paid}`);
      console.log(`Balance (amount_pending): ₹${patient.amount_pending}`);
      console.log(`Initial Advance (payAmount): ₹${patient.payAmount}`);
      console.log(`Total Paid (calculated): ₹${patient.total_paid}`);
    }
    
    console.log('\nStats:', juneData.stats);
    
    console.log('\n=== JULY 2025 (Non-joining Month) ===');
    const julyResponse = await fetch(`${API_URL}/patient-payments/all?month=7&year=2025`);
    const julyData = await julyResponse.json();
    
    if (julyData.patients && julyData.patients.length > 0) {
      const patient = julyData.patients[0];
      console.log(`Patient: ${patient.patient_name} (${patient.patient_id})`);
      console.log(`Monthly Fees: ₹${patient.fees}`);
      console.log(`Other Fees (Month-specific): ₹${patient.month_specific_other_fees}`);
      console.log(`Total Amount: ₹${patient.total_amount}`);
      console.log(`Amount Paid: ₹${patient.amount_paid}`);
      console.log(`Balance (amount_pending): ₹${patient.amount_pending}`);
      console.log(`Total Paid (calculated): ₹${patient.total_paid}`);
    }
    
    console.log('\nStats:', julyData.stats);
    
    // Test Payment History
    console.log('\n=== PAYMENT HISTORY ===');
    const historyResponse = await fetch(`${API_URL}/patient-payments/history/P0002?month=6&year=2025`);
    const historyData = await historyResponse.json();
    console.log('June 2025 Payment History:', historyData);
    
    const historyJulyResponse = await fetch(`${API_URL}/patient-payments/history/P0002?month=7&year=2025`);
    const historyJulyData = await historyJulyResponse.json();
    console.log('July 2025 Payment History:', historyJulyData);
    
  } catch (error) {
    console.error('❌ Error testing payments:', error);
  }
}

testPaymentCalculations();
