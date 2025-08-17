import db from './db/config.js';

async function testPatientUpdate() {
  try {
    console.log('🧪 Testing Patient Update Process...\n');
    
    // Step 1: Get a test patient
    const [patients] = await db.query('SELECT id, name, admissionDate, dateOfBirth FROM patients WHERE is_deleted = FALSE LIMIT 1');
    
    if (patients.length === 0) {
      console.log('❌ No patients found for testing');
      return;
    }
    
    const testPatient = patients[0];
    console.log('📋 Test Patient:');
    console.log(`  ID: ${testPatient.id}`);
    console.log(`  Name: ${testPatient.name}`);
    console.log(`  Current admissionDate: ${testPatient.admissionDate}`);
    console.log(`  Current dateOfBirth: ${testPatient.dateOfBirth}`);
    
    // Step 2: Test the convertDateFormat function
    console.log('\n🔧 Testing convertDateFormat function...');
    
    const convertDateFormat = (dateStr) => {
      if (!dateStr) return null;
      try {
        console.log(`  Input: "${dateStr}" (type: ${typeof dateStr})`);
        
        // Check if already in yyyy-MM-dd format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          console.log('  ✅ Already in YYYY-MM-DD format');
          return dateStr;
        }
        
        // Convert dd-MM-yyyy to yyyy-MM-dd
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split('-');
          const result = `${year}-${month}-${day}`;
          console.log(`  ✅ Converted DD-MM-YYYY to: ${result}`);
          return result;
        }
        
        // If it's a Date object, convert to yyyy-MM-dd
        if (dateStr instanceof Date) {
          const result = dateStr.toISOString().split('T')[0];
          console.log(`  ✅ Converted Date object to: ${result}`);
          return result;
        }
        
        console.log('  ❌ No conversion applied');
        return null;
      } catch (error) {
        console.error('  ❌ Date conversion error:', error);
        return null;
      }
    };
    
    // Test various date formats
    const testDates = [
      '17-08-2025',  // DD-MM-YYYY format from frontend
      '2025-08-17',  // YYYY-MM-DD format
      '15-01-1990',  // Another DD-MM-YYYY
      new Date('2025-08-17'), // Date object
      '',            // Empty string
      null,          // Null
      '31-12-2024'   // End of year date
    ];
    
    testDates.forEach(testDate => {
      console.log(`\nTesting: ${testDate}`);
      const result = convertDateFormat(testDate);
      console.log(`Result: ${result}`);
    });
    
    // Step 3: Test actual database update
    console.log('\n📝 Testing actual database update...');
    
    const testAdmissionDate = '17-08-2025'; // Today's date in DD-MM-YYYY format
    const testBirthDate = '15-01-1990';     // Birth date in DD-MM-YYYY format
    
    const convertedAdmission = convertDateFormat(testAdmissionDate);
    const convertedBirth = convertDateFormat(testBirthDate);
    
    console.log(`Converting admission date: ${testAdmissionDate} → ${convertedAdmission}`);
    console.log(`Converting birth date: ${testBirthDate} → ${convertedBirth}`);
    
    if (convertedAdmission && convertedBirth) {
      console.log('\n🔄 Executing update query...');
      
      const updateQuery = `
        UPDATE patients 
        SET admissionDate = ?, dateOfBirth = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      const values = [convertedAdmission, convertedBirth, testPatient.id];
      
      console.log('Query:', updateQuery);
      console.log('Values:', values);
      
      const [result] = await db.query(updateQuery, values);
      
      console.log(`✅ Update result: ${result.affectedRows} rows affected`);
      
      // Step 4: Verify the update
      console.log('\n🔍 Verifying update...');
      const [updatedPatients] = await db.query(
        'SELECT id, name, admissionDate, dateOfBirth FROM patients WHERE id = ?', 
        [testPatient.id]
      );
      
      if (updatedPatients.length > 0) {
        const updated = updatedPatients[0];
        console.log('Updated patient data:');
        console.log(`  admissionDate: ${updated.admissionDate} (type: ${typeof updated.admissionDate})`);
        console.log(`  dateOfBirth: ${updated.dateOfBirth} (type: ${typeof updated.dateOfBirth})`);
        
        // Check if dates are valid
        if (updated.admissionDate && updated.admissionDate.toString() !== '0000-00-00') {
          console.log('  ✅ Admission date saved correctly');
        } else {
          console.log('  ❌ Admission date not saved correctly');
        }
        
        if (updated.dateOfBirth && updated.dateOfBirth.toString() !== '0000-00-00') {
          console.log('  ✅ Birth date saved correctly');
        } else {
          console.log('  ❌ Birth date not saved correctly');
        }
      }
    } else {
      console.log('❌ Date conversion failed, skipping database update');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPatientUpdate();
