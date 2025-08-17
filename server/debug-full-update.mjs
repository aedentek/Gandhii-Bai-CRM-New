// Test the exact same update process as the API
import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host:'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

const convertDateFormat = (dateStr) => {
  console.log(`🔧 convertDateFormat called with: "${dateStr}" (type: ${typeof dateStr})`);
  
  if (!dateStr) {
    console.log('❌ No dateStr provided, returning null');
    return null;
  }
  
  try {
    // Check if already in yyyy-MM-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log('✅ Already in yyyy-MM-dd format');
      return dateStr;
    }
    
    // Convert dd-MM-yyyy to yyyy-MM-dd
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      console.log('🔄 Converting dd-MM-yyyy to yyyy-MM-dd');
      const [day, month, year] = dateStr.split('-');
      console.log(`  Parts: day=${day}, month=${month}, year=${year}`);
      const result = `${year}-${month}-${day}`;
      console.log(`  Result: ${result}`);
      return result;
    }
    
    // If it's a Date object, convert to yyyy-MM-dd
    if (dateStr instanceof Date) {
      console.log('📅 Converting Date object');
      const result = dateStr.toISOString().split('T')[0];
      console.log(`  Result: ${result}`);
      return result;
    }
    
    console.log('❌ No matching format found');
    return null;
  } catch (error) {
    console.error('❌ Date conversion error:', error);
    return null;
  }
};

async function testUpdate() {
  let db;
  try {
    // Connect to database
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    const patientId = 102;
    const reqBody = {
      admissionDate: '19-08-2025',
      dateOfBirth: '17-01-1990'
    };

    console.log('\n🔄 Starting update process...');
    console.log('Patient ID:', patientId);
    console.log('Request body:', JSON.stringify(reqBody, null, 2));
    
    // Mimic the exact update logic from the API
    const updates = [];
    const values = [];
    
    const validFields = [
      'name', 'age', 'gender', 'phone', 'email', 'address', 'emergencyContact',
      'medicalHistory', 'status', 'attenderName', 'attenderPhone', 'attenderRelationship',
      'photo', 'patientAadhar', 'patientPan', 'attenderAadhar', 'attenderPan',
      'fees', 'bloodTest', 'pickupCharge', 'totalAmount', 'payAmount', 'balance',
      'paymentType', 'fatherName', 'motherName', 'dateOfBirth', 'marriageStatus',
      'employeeStatus', 'admissionDate'
    ];

    // Process each field
    for (const [field, fieldValue] of Object.entries(reqBody)) {
      if (validFields.includes(field) && fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        console.log(`\n📝 Processing field: ${field}`);
        console.log(`  Value: "${fieldValue}" (type: ${typeof fieldValue})`);
        
        if (field === 'admissionDate' || field === 'dateOfBirth') {
          const convertedDate = convertDateFormat(fieldValue);
          console.log(`  🔄 Converted date: ${convertedDate}`);
          
          if (convertedDate) {
            updates.push(`${field} = ?`);
            values.push(convertedDate);
            console.log(`  ✅ Added to query: ${field} = ${convertedDate}`);
          } else {
            console.log(`  ❌ Failed to convert date, skipping field`);
          }
        } else {
          updates.push(`${field} = ?`);
          values.push(fieldValue);
          console.log(`  ✅ Added to query: ${field} = ${fieldValue}`);
        }
      }
    }

    if (updates.length === 0) {
      console.log('❌ No fields to update');
      return;
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Build and execute query
    const query = `UPDATE patients SET ${updates.join(', ')} WHERE id=? AND is_deleted=FALSE`;
    values.push(patientId);
    
    console.log('\n🗃️ Executing query...');
    console.log('Query:', query);
    console.log('Values:', values);
    
    const [result] = await db.execute(query, values);
    console.log('✅ Update result:', result);
    
    // Verify the update
    console.log('\n🔍 Verifying update...');
    const [verifyRows] = await db.query(
      'SELECT admissionDate, dateOfBirth FROM patients WHERE id = ?', 
      [patientId]
    );
    
    if (verifyRows.length > 0) {
      const patient = verifyRows[0];
      console.log('📋 Updated patient data:');
      console.log('  admissionDate:', patient.admissionDate, '(type:', typeof patient.admissionDate, ')');
      console.log('  dateOfBirth:', patient.dateOfBirth, '(type:', typeof patient.dateOfBirth, ')');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

testUpdate();
