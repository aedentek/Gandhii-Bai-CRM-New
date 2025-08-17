import db from './db/config.js';

try {
  console.log('🔍 Testing date conversion and saving...');
  
  // Test the convertDateFormat function
  const testDates = [
    '17-08-2025',  // DD-MM-YYYY format
    '2025-08-17',  // YYYY-MM-DD format
    '',            // Empty string
    null,          // Null value
  ];
  
  console.log('\n📅 Testing date conversion:');
  testDates.forEach(date => {
    console.log(`Input: "${date}" → Output: "${convertDateFormat(date)}"`);
  });
  
  // Helper function to convert dd-MM-yyyy to yyyy-MM-dd for MySQL
  function convertDateFormat(dateStr) {
    if (!dateStr) return null;
    try {
      // Check if already in yyyy-MM-dd format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      
      // Convert dd-MM-yyyy to yyyy-MM-dd
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      }
      
      // If it's a Date object, convert to yyyy-MM-dd
      if (dateStr instanceof Date) {
        return dateStr.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      console.error('Date conversion error:', error);
      return null;
    }
  }
  
  // Test actual database update
  console.log('\n🧪 Testing database update...');
  
  // Get a patient to test with
  const [patients] = await db.query('SELECT id, name FROM patients WHERE is_deleted = FALSE LIMIT 1');
  
  if (patients.length > 0) {
    const patientId = patients[0].id;
    const testAdmissionDate = '17-08-2025';
    const testBirthDate = '15-01-1990';
    
    console.log(`Testing with patient ID: ${patientId}`);
    console.log(`Test admission date: ${testAdmissionDate}`);
    console.log(`Test birth date: ${testBirthDate}`);
    
    // Convert dates
    const convertedAdmission = convertDateFormat(testAdmissionDate);
    const convertedBirth = convertDateFormat(testBirthDate);
    
    console.log(`Converted admission: ${convertedAdmission}`);
    console.log(`Converted birth: ${convertedBirth}`);
    
    // Update the database
    const updateQuery = `
      UPDATE patients 
      SET admissionDate = ?, dateOfBirth = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    console.log('Executing update query...');
    const [result] = await db.query(updateQuery, [convertedAdmission, convertedBirth, patientId]);
    
    console.log('Update result:', result);
    
    // Verify the update
    const [verifyResult] = await db.query(
      'SELECT admissionDate, dateOfBirth FROM patients WHERE id = ?', 
      [patientId]
    );
    
    console.log('Verification result:');
    console.log('  admissionDate:', verifyResult[0].admissionDate);
    console.log('  dateOfBirth:', verifyResult[0].dateOfBirth);
    
  } else {
    console.log('No patients found to test with');
  }
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
