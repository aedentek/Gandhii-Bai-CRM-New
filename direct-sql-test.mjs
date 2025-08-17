import mysql from 'mysql2/promise';

// Database connection
const db = mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testPatientInsert() {
  try {
    console.log('🔍 Testing direct SQL insert...');
    
    // Test data
    const testData = [
      'P0099', 'TEST PATIENT SQL', 35, 'Male', '8888888888',
      'test@email.com', 'Test Address', 'Emergency Contact', 'Medical History',
      new Date().toISOString().split('T')[0], 'Active', 'Attender Name', '9999999999',
      'Son', 'Married', 'Self Employed', // These are the critical fields
      'Guardian Name', '7777777777', 'Father', 'Engineer', 'married', 'English',
      null, 'Aadhar123', 'Pan123', 'AttAadhar123', 'AttPan123', 1000, 500, 200,
      1700, 1000, 700, 'Cash', 'Father Name', 'Mother Name', '1990-01-01'
    ];
    
    console.log('📊 Test data count:', testData.length);
    console.log('🎯 Critical fields:', {
      attenderRelationship: testData[13],
      marriageStatus: testData[14], 
      employeeStatus: testData[15]
    });
    
    // Direct SQL insert
    const [result] = await db.query(
      `INSERT INTO patients (
        patient_id, name, age, gender, phone, email, address, emergencyContact, medicalHistory,
        admissionDate, status, attenderName, attenderPhone,
        attenderRelationship, marriageStatus, employeeStatus,
        guardian_name, guardian_phone, guardian_relation, occupation, marital_status, language_preference,
        photo, patientAadhar, patientPan, attenderAadhar, attenderPan, fees, bloodTest, pickupCharge, 
        totalAmount, payAmount, balance, paymentType, fatherName, motherName, dateOfBirth
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      testData
    );
    
    console.log('✅ SUCCESS! Patient inserted with ID:', result.insertId);
    
    // Verify the insert
    const [rows] = await db.query(
      'SELECT patient_id, name, attenderRelationship, marriageStatus, employeeStatus FROM patients WHERE id = ?',
      [result.insertId]
    );
    
    console.log('📋 Verification:', rows[0]);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await db.end();
  }
}

testPatientInsert();
