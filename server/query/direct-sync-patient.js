// Direct sync script for the SABARISH T patient we know exists
import mysql from 'mysql2/promise';

const db = await mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function directSyncPatient() {
  try {
    console.log('🔄 Direct sync for SABARISH T patient...');
    
    // Data from the API test:
    // ID: 6, Name: SABARISH T
    // Fees: 15000, Blood Test: 500, Pickup Charge: 1200
    // Pay Amount: 200, Balance: 16500
    
    const monthlyFees = 15000;
    const bloodTest = 500;
    const pickupCharge = 1200;
    const otherFees = bloodTest + pickupCharge; // 1700
    const paidAmount = 200;
    const totalAmount = monthlyFees + otherFees; // 16700
    const balance = totalAmount - paidAmount; // 16500
    
    console.log('💰 Payment calculation:');
    console.log(`  Monthly Fees: ₹${monthlyFees}`);
    console.log(`  Other Fees (Blood Test + Pickup): ₹${otherFees}`);
    console.log(`  Total Amount: ₹${totalAmount}`);
    console.log(`  Paid Amount: ₹${paidAmount}`);
    console.log(`  Balance: ₹${balance}`);
    
    // Check if record already exists
    const [existing] = await db.query(
      'SELECT id FROM patient_payments WHERE patient_id = ?',
      ['6']
    );
    
    if (existing.length === 0) {
      console.log('➕ Creating payment record...');
      
      await db.query(`
        INSERT INTO patient_payments (
          patient_id, patient_name, monthly_fees, other_fees, carry_forward,
          paid_amount, total_balance, payment_status, payment_type, payment_date, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        '6',                    // patient_id
        'SABARISH T',          // patient_name
        monthlyFees,           // monthly_fees
        otherFees,             // other_fees
        0,                     // carry_forward
        paidAmount,            // paid_amount
        balance,               // total_balance
        'Partial',             // payment_status (since balance > 0)
        'Cash',                // payment_type
        new Date().toISOString().split('T')[0], // payment_date
        'Synced payment data for SABARISH T'    // description
      ]);
      
      console.log('✅ Payment record created successfully!');
    } else {
      console.log('⚠️  Payment record already exists, updating...');
      
      await db.query(`
        UPDATE patient_payments SET
          patient_name = ?, monthly_fees = ?, other_fees = ?, 
          paid_amount = ?, total_balance = ?, payment_status = ?, 
          payment_type = ?, updated_at = NOW()
        WHERE patient_id = ?
      `, [
        'SABARISH T',
        monthlyFees,
        otherFees,
        paidAmount,
        balance,
        'Partial',
        'Cash',
        '6'
      ]);
      
      console.log('✅ Payment record updated successfully!');
    }
    
    // Verify the record
    const [result] = await db.query(
      'SELECT * FROM patient_payments WHERE patient_id = ?',
      ['6']
    );
    
    if (result.length > 0) {
      const record = result[0];
      console.log('\n📋 Verification - Payment record:');
      console.log(`  ID: ${record.id}`);
      console.log(`  Patient ID: ${record.patient_id}`);
      console.log(`  Patient Name: ${record.patient_name}`);
      console.log(`  Monthly Fees: ₹${record.monthly_fees}`);
      console.log(`  Other Fees: ₹${record.other_fees}`);
      console.log(`  Paid Amount: ₹${record.paid_amount}`);
      console.log(`  Total Balance: ₹${record.total_balance}`);
      console.log(`  Status: ${record.payment_status}`);
    }
    
    console.log('\n🎉 Direct sync completed! Now check the PatientPaymentFees page.');
    
  } catch (error) {
    console.error('❌ Error in direct sync:', error);
  } finally {
    await db.end();
  }
}

directSyncPatient();
