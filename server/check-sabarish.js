const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database u745362362_crm');
  
  // Check Sabarish patient data
  const query = `
    SELECT 
      id, 
      registrationId, 
      name, 
      admissionDate,
      fees,
      pickupCharge,
      bloodTest,
      otherFees,
      payAmount,
      balance
    FROM PatientList 
    WHERE name LIKE '%Sabarish%'
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Query failed:', err);
      db.end();
      return;
    }
    
    console.log('\nSabarish Patient Data:');
    console.log(JSON.stringify(results, null, 2));
    
    if (results.length > 0) {
      const patient = results[0];
      console.log('\nAnalysis:');
      console.log(`- Name: ${patient.name}`);
      console.log(`- Registration ID: ${patient.registrationId}`);
      console.log(`- Admission Date: ${patient.admissionDate}`);
      console.log(`- Monthly Fees: ${patient.fees}`);
      console.log(`- Pickup Charge: ${patient.pickupCharge}`);
      console.log(`- Blood Test: ${patient.bloodTest}`);
      console.log(`- Other Fees (DB): ${patient.otherFees}`);
      console.log(`- Pay Amount: ${patient.payAmount}`);
      console.log(`- Balance: ${patient.balance}`);
      
      // Check if otherFees column exists and has data
      if (patient.otherFees === null || patient.otherFees === undefined) {
        console.log('\nWARNING: otherFees column is NULL - trigger might not be working');
      }
      
      if (patient.payAmount === null || patient.payAmount === undefined) {
        console.log('WARNING: payAmount is NULL - no payment recorded');
      }
    } else {
      console.log('ERROR: No patient found with name containing "Sabarish"');
    }
    
    db.end();
  });
});
