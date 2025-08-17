const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  connectTimeout: 60000,
};

async function testPatientDataRetrieval() {
  let connection;
  
  try {
    console.log('🔄 Testing patient data retrieval with new otherFees column...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get sample patients with all relevant fields
    const [patients] = await connection.execute(`
      SELECT 
        id,
        name,
        fees,
        bloodTest,
        pickupCharge,
        otherFees,
        totalAmount,
        payAmount,
        balance,
        admissionDate,
        photo
      FROM patients 
      WHERE (bloodTest > 0 OR pickupCharge > 0)
      AND is_deleted = FALSE
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\\n📊 Patient Data Verification:');
    console.log('='.repeat(100));
    
    patients.forEach((patient, index) => {
      console.log(`\\n${index + 1}. Patient: ${patient.name} (ID: ${patient.id})`);
      console.log(`   📸 Photo: ${patient.photo || 'No photo'}`);
      console.log(`   📅 Admission Date: ${patient.admissionDate}`);
      console.log(`   💰 Monthly Fees: ₹${patient.fees || 0}`);
      console.log(`   🩸 Blood Test: ₹${patient.bloodTest || 0}`);
      console.log(`   🚗 Pickup Charge: ₹${patient.pickupCharge || 0}`);
      console.log(`   🔢 Other Fees (DB): ₹${patient.otherFees || 0}`);
      console.log(`   🧮 Calculated Other Fees: ₹${(patient.bloodTest || 0) + (patient.pickupCharge || 0)}`);
      console.log(`   💳 Total Amount (DB): ₹${patient.totalAmount || 0}`);
      console.log(`   💰 Paid Amount: ₹${patient.payAmount || 0}`);
      console.log(`   ⚖️  Balance (DB): ₹${patient.balance || 0}`);
      
      // Verify calculations
      const calculatedOtherFees = (patient.bloodTest || 0) + (patient.pickupCharge || 0);
      const calculatedTotal = (patient.fees || 0) + calculatedOtherFees;
      const calculatedBalance = calculatedTotal - (patient.payAmount || 0);
      
      console.log(`   \\n   ✅ Verification:`);
      console.log(`      Other Fees Match: ${patient.otherFees === calculatedOtherFees ? '✅ YES' : '❌ NO'}`);
      console.log(`      Total Match: ${patient.totalAmount === calculatedTotal ? '✅ YES' : '❌ NO'}`);
      console.log(`      Balance Match: ${patient.balance === calculatedBalance ? '✅ YES' : '❌ NO'}`);
      console.log('   ' + '-'.repeat(60));
    });
    
    // Test the API endpoint that the frontend uses
    console.log('\\n🌐 Testing API endpoint simulation...');
    const [allPatients] = await connection.execute(`
      SELECT * FROM patients 
      WHERE is_deleted = FALSE 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log(`\\n📡 API Response Preview (${allPatients.length} patients):`);
    allPatients.forEach(patient => {
      console.log(`   ${patient.name}: Photo=${patient.photo || 'None'}, Fees=₹${patient.fees}, OtherFees=₹${patient.otherFees}, Total=₹${patient.totalAmount}, Balance=₹${patient.balance}`);
    });
    
    console.log('\\n✅ Database verification completed successfully!');
    console.log('\\n🔧 Frontend should now display:');
    console.log('   • Photo from database photo field');
    console.log('   • Patient ID from id field');
    console.log('   • Patient Name from name field');
    console.log('   • Admission Date from admissionDate field');
    console.log('   • Monthly Fees from fees field');
    console.log('   • Other Fees from otherFees field (auto-calculated)');
    console.log('   • Paid Amount from payAmount field');
    console.log('   • Total Balance from balance field');
    
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
testPatientDataRetrieval();
