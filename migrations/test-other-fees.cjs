const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  connectTimeout: 60000,
};

async function testOtherFeesImplementation() {
  let connection;
  
  try {
    console.log('🔄 Testing Other Fees implementation...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if otherFees column exists
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM patients LIKE 'otherFees'
    `);
    
    if (columns.length > 0) {
      console.log('✅ otherFees column exists:', columns[0]);
    } else {
      console.log('❌ otherFees column does not exist');
      return;
    }
    
    // Test the trigger by creating a dummy patient
    console.log('🧪 Testing trigger with dummy patient...');
    
    // Generate a unique patient ID for testing
    const testPatientId = `PTEST${Date.now().toString().slice(-4)}`;
    
    await connection.execute(`
      INSERT INTO patients (
        patient_id, name, age, gender, phone, address, emergencyContact, 
        status, fees, bloodTest, pickupCharge, payAmount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testPatientId,
      'Test Patient OtherFees',
      25,
      'Male',
      '9999999999',
      'Test Address',
      '8888888888',
      'Active',
      5000, // Monthly fees
      1500, // Blood test
      800,  // Pickup charge
      1000  // Pay amount
    ]);
    
    console.log('✅ Test patient created with ID:', testPatientId);
    
    // Fetch the created patient to verify otherFees calculation
    const [result] = await connection.execute(`
      SELECT 
        patient_id, 
        name, 
        fees, 
        bloodTest, 
        pickupCharge, 
        otherFees,
        totalAmount,
        payAmount,
        balance
      FROM patients 
      WHERE patient_id = ?
    `, [testPatientId]);
    
    if (result.length > 0) {
      const patient = result[0];
      console.log('\\n📊 Test Patient Data:');
      console.log('='.repeat(50));
      console.log(`Patient ID: ${patient.patient_id}`);
      console.log(`Name: ${patient.name}`);
      console.log(`Monthly Fees: ₹${patient.fees}`);
      console.log(`Blood Test: ₹${patient.bloodTest}`);
      console.log(`Pickup Charge: ₹${patient.pickupCharge}`);
      console.log(`Other Fees (Auto): ₹${patient.otherFees}`);
      console.log(`Total Amount: ₹${patient.totalAmount}`);
      console.log(`Pay Amount: ₹${patient.payAmount}`);
      console.log(`Balance: ₹${patient.balance}`);
      
      // Verify calculation
      const expectedOtherFees = Number(patient.bloodTest) + Number(patient.pickupCharge);
      const isCorrect = Number(patient.otherFees) === expectedOtherFees;
      
      console.log('\\n🔍 Verification:');
      console.log(`Expected Other Fees: ₹${expectedOtherFees}`);
      console.log(`Actual Other Fees: ₹${patient.otherFees}`);
      console.log(`✅ Calculation Correct: ${isCorrect ? 'YES' : 'NO'}`);
      
      if (isCorrect) {
        console.log('\\n🎉 Other Fees implementation is working correctly!');
      } else {
        console.log('\\n❌ Other Fees calculation is incorrect');
      }
    }
    
    // Clean up test data
    console.log('\\n🧹 Cleaning up test data...');
    await connection.execute('DELETE FROM patients WHERE patient_id = ?', [testPatientId]);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testOtherFeesImplementation();
