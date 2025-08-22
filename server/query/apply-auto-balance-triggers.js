// Script to apply auto-balance update triggers to the database
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function applyAutoBalanceTriggers() {
  let connection;
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Read the trigger SQL file
    const triggerFilePath = path.join(__dirname, '..', 'migrations', 'create-auto-balance-triggers.sql');
    
    if (!fs.existsSync(triggerFilePath)) {
      console.error('❌ Trigger file not found:', triggerFilePath);
      return;
    }

    const triggerSQL = fs.readFileSync(triggerFilePath, 'utf8');
    console.log('📄 Read trigger SQL file');

    // Execute the trigger creation SQL
    console.log('⚙️ Creating auto-balance triggers...');
    await connection.query(triggerSQL);
    console.log('✅ Auto-balance triggers created successfully!');

    // Test the triggers by checking current data
    console.log('\n📊 Testing triggers with current data...');
    const [patients] = await connection.query(`
      SELECT 
        p.id,
        p.name,
        p.fees,
        p.otherFees,
        (p.fees + COALESCE(p.otherFees, 0)) as calculated_total_fees,
        p.payAmount as current_pay_amount,
        p.balance as current_balance,
        COALESCE(payments.total_paid, 0) as actual_total_paid,
        GREATEST(0, (p.fees + COALESCE(p.otherFees, 0)) - COALESCE(payments.total_paid, 0)) as calculated_balance
      FROM patients p
      LEFT JOIN (
        SELECT 
          patientId,
          SUM(amount) as total_paid
        FROM patient_payments 
        GROUP BY patientId
      ) payments ON p.id = payments.patientId
      WHERE p.id IN (SELECT DISTINCT patientId FROM patient_payments LIMIT 5)
    `);

    console.log('\n📋 Current patient balance data:');
    patients.forEach(patient => {
      const balanceMatch = Math.abs(patient.current_balance - patient.calculated_balance) < 0.01;
      const payMatch = Math.abs(patient.current_pay_amount - patient.actual_total_paid) < 0.01;
      
      console.log(`\n  👤 ${patient.name} (ID: ${patient.id}):`);
      console.log(`     Total Fees: ₹${patient.calculated_total_fees}`);
      console.log(`     Current Pay Amount: ₹${patient.current_pay_amount} | Actual: ₹${patient.actual_total_paid} ${payMatch ? '✅' : '❌'}`);
      console.log(`     Current Balance: ₹${patient.current_balance} | Calculated: ₹${patient.calculated_balance} ${balanceMatch ? '✅' : '❌'}`);
    });

    // Now test adding a payment to see if triggers work
    console.log('\n🧪 Testing trigger by adding a test payment...');
    
    if (patients.length > 0) {
      const testPatient = patients[0];
      const testAmount = 100;
      
      console.log(`💰 Adding test payment of ₹${testAmount} for ${testPatient.name}...`);
      
      await connection.query(`
        INSERT INTO patient_payments (patientId, date, amount, comment, paymentMode, createdBy, createdAt)
        VALUES (?, CURDATE(), ?, 'Test payment for trigger verification', 'Cash', 'System Test', NOW())
      `, [testPatient.id, testAmount]);
      
      // Check if patient balance was updated automatically
      const [updatedPatient] = await connection.query(`
        SELECT payAmount, balance, updated_at
        FROM patients 
        WHERE id = ?
      `, [testPatient.id]);
      
      if (updatedPatient.length > 0) {
        const updated = updatedPatient[0];
        const expectedPaid = testPatient.actual_total_paid + testAmount;
        const expectedBalance = Math.max(0, testPatient.calculated_total_fees - expectedPaid);
        
        console.log(`   Expected Pay Amount: ₹${expectedPaid} | Actual: ₹${updated.payAmount}`);
        console.log(`   Expected Balance: ₹${expectedBalance} | Actual: ₹${updated.balance}`);
        console.log(`   Updated At: ${updated.updated_at}`);
        
        if (Math.abs(updated.payAmount - expectedPaid) < 0.01 && Math.abs(updated.balance - expectedBalance) < 0.01) {
          console.log('   ✅ TRIGGER WORKING CORRECTLY!');
        } else {
          console.log('   ❌ Trigger not working as expected');
        }
      }
      
      // Clean up test payment
      await connection.query(`
        DELETE FROM patient_payments 
        WHERE patientId = ? AND comment = 'Test payment for trigger verification'
      `, [testPatient.id]);
      console.log('🧹 Cleaned up test payment');
    }

    console.log('\n🎉 Auto-balance triggers setup complete!');
    console.log('\n📝 How it works:');
    console.log('   ✅ When a payment is ADDED → Patient balance updates automatically');
    console.log('   ✅ When a payment is UPDATED → Patient balance recalculates automatically');
    console.log('   ✅ When a payment is DELETED → Patient balance recalculates automatically');
    console.log('   ✅ When patient fees change → Patient balance recalculates automatically');

  } catch (error) {
    console.error('❌ Error setting up auto-balance triggers:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔗 Database connection closed');
    }
  }
}

// Run the script
applyAutoBalanceTriggers();
