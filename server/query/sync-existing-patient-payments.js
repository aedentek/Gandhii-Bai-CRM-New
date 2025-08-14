// Script to sync existing patient payment data from patients table to patient_payments table
import mysql from 'mysql2/promise';

// MySQL connection config (replace with your Hostinger DB credentials)
const db = await mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function syncExistingPatientPayments() {
  try {
    console.log('🔄 Starting sync of existing patient payment data...');
    
    // Get all patients with payment data
    console.log('📋 Querying patients table...');
    const [patients] = await db.query(`
      SELECT id, name, fees, bloodTest, pickupCharge, payAmount, balance, paymentType, admissionDate, created_at
      FROM patients 
      WHERE (fees > 0 OR payAmount > 0) AND (deleted_at IS NULL OR is_deleted = 0)
    `);
    
    console.log(`📋 Found ${patients.length} patients with payment data`);
    
    if (patients.length === 0) {
      console.log('⚠️  No patients found with payment data');
      return;
    }
    
    // Show first patient data for debugging
    if (patients.length > 0) {
      const first = patients[0];
      console.log('📋 First patient data:');
      console.log(`  ID: ${first.id}, Name: ${first.name}`);
      console.log(`  Fees: ${first.fees}, Blood Test: ${first.bloodTest}, Pickup: ${first.pickupCharge}`);
      console.log(`  Pay Amount: ${first.payAmount}, Balance: ${first.balance}`);
    }
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const patient of patients) {
      try {
        console.log(`\n🔄 Processing patient: ${patient.name} (ID: ${patient.id})`);
        
        const monthlyFees = Number(patient.fees || 0);
        const bloodTest = Number(patient.bloodTest || 0);
        const pickupCharge = Number(patient.pickupCharge || 0);
        const otherFees = bloodTest + pickupCharge;
        const paidAmount = Number(patient.payAmount || 0);
        const totalAmount = monthlyFees + otherFees;
        const balance = totalAmount - paidAmount;
        
        console.log(`  Monthly Fees: ${monthlyFees}, Other Fees: ${otherFees}, Paid: ${paidAmount}, Balance: ${balance}`);
        
        // Skip if no fees or payment amount
        if (totalAmount === 0 && paidAmount === 0) {
          console.log('  ⏭️  Skipping - no payment data');
          continue;
        }
        
        // Check if payment record already exists
        const [existing] = await db.query(
          'SELECT id FROM patient_payments WHERE patient_id = ?',
          [patient.id]
        );
        
        if (existing.length === 0) {
          // Create new payment record
          const paymentDate = patient.admissionDate || patient.created_at || new Date().toISOString().split('T')[0];
          
          console.log('  ➕ Creating new payment record...');
          
          await db.query(`
            INSERT INTO patient_payments (
              patient_id, patient_name, monthly_fees, other_fees, carry_forward,
              paid_amount, total_balance, payment_status, payment_type, payment_date, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            patient.id,
            patient.name,
            monthlyFees,
            otherFees,
            0, // carry_forward
            paidAmount,
            balance,
            balance <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending'),
            patient.paymentType || 'Cash',
            paymentDate,
            `Synced payment data for ${patient.name}`
          ]);
          
          syncedCount++;
          console.log(`  ✅ Synced payment data for patient: ${patient.name} (ID: ${patient.id})`);
        } else {
          console.log(`  ⏭️  Payment record already exists for patient: ${patient.name} (ID: ${patient.id})`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error syncing patient ${patient.name}:`, error);
      }
    }
    
    console.log(`\n🎉 Sync completed!`);
    console.log(`  Synced: ${syncedCount} records`);
    console.log(`  Errors: ${errorCount} records`);
    console.log(`  Total processed: ${patients.length} patients`);
    
    // Show summary of synced data
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(monthly_fees) as total_monthly_fees,
        SUM(other_fees) as total_other_fees,
        SUM(paid_amount) as total_paid,
        SUM(total_balance) as total_balance,
        COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN payment_status = 'Partial' THEN 1 END) as partial_count
      FROM patient_payments
    `);
    
    console.log('\n📊 Payment Summary:');
    console.log(`  Total Records: ${summary[0].total_records}`);
    console.log(`  Total Monthly Fees: ₹${summary[0].total_monthly_fees || 0}`);
    console.log(`  Total Other Fees: ₹${summary[0].total_other_fees || 0}`);
    console.log(`  Total Paid Amount: ₹${summary[0].total_paid || 0}`);
    console.log(`  Total Balance: ₹${summary[0].total_balance || 0}`);
    console.log(`  Paid: ${summary[0].paid_count}, Pending: ${summary[0].pending_count}, Partial: ${summary[0].partial_count}`);
    
  } catch (error) {
    console.error('❌ Error syncing patient payments:', error);
  } finally {
    await db.end();
  }
}

syncExistingPatientPayments();
