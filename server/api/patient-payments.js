import express from 'express';
import db from '../db/config.js';

const router = express.Router();

console.log('🏥 Patient Payments routes module loaded!');

// Get all patient payments with pagination and filtering
router.get('/patient-payments/all', async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10 } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log(`📋 Getting patient payment data for ${targetMonth}/${targetYear}`);
    
    // Get active patients who were admitted in or before the selected month/year
    // Now with month-specific other fees from test reports
    const [patients] = await db.execute(`
      SELECT 
        p.id,
        p.name as patient_name,
        p.phone,
        p.address,
        p.age,
        p.gender,
        p.dateOfBirth,
        p.admissionDate,
        p.status,
        p.attenderName,
        p.attenderPhone,
        p.attenderRelationship,
        p.photo,
        CONCAT('P', LPAD(p.id, 4, '0')) as patient_id,
        COALESCE(p.fees, 0) as fees,
        
        -- Get month-specific other fees with simplified logic
        COALESCE(
          -- If current month/year matches admission month/year, include blood test + pickup charges + test reports
          CASE 
            WHEN YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) = ?
            THEN COALESCE(p.bloodTest, 0) + COALESCE(p.pickupCharge, 0) + COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
            -- For other months, only include test reports
            ELSE COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
          END
        ) as month_specific_other_fees,
        
        -- Keep original values for reference (but use month-specific for calculations)
        COALESCE(p.bloodTest, 0) as bloodTest,
        COALESCE(p.pickupCharge, 0) as pickupCharge,
        COALESCE(p.otherFees, 0) as otherFees,
        
        -- Calculate total amount using simplified other fees logic + monthly consultation fees
        COALESCE(p.fees, 0) + COALESCE(
          -- If current month/year matches admission month/year, include blood test + pickup charges + test reports
          CASE 
            WHEN YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) = ?
            THEN COALESCE(p.bloodTest, 0) + COALESCE(p.pickupCharge, 0) + COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
            -- For other months, only include test reports
            ELSE COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
          END
        ) as total_amount,
        
        -- ✅ FIXED: Calculate month-specific payments only, not overall payments
        COALESCE(
          (SELECT SUM(pph.payment_amount) 
           FROM patient_payment_history pph
           WHERE pph.patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
           AND YEAR(pph.payment_date) = ?
           AND MONTH(pph.payment_date) = ?
          ), 0) as amount_paid,
        
        -- ✅ FIXED: Calculate correct balance = Monthly Fees + Other Fees + Carry Forward - Amount Paid
        (COALESCE(p.fees, 0) + COALESCE(
          -- If current month/year matches admission month/year, include blood test + pickup charges + test reports
          CASE 
            WHEN YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) = ?
            THEN COALESCE(p.bloodTest, 0) + COALESCE(p.pickupCharge, 0) + COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
            -- For other months, only include test reports
            ELSE COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
          END
        ) + COALESCE(
          (SELECT carry_forward_to_next 
           FROM patient_monthly_records pmr
           WHERE pmr.patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
           AND ((pmr.month = ? - 1 AND pmr.year = ?) OR (pmr.month = 12 AND pmr.year = ? - 1 AND ? = 1))
           ORDER BY pmr.id DESC 
           LIMIT 1
          ), 0) - COALESCE(p.payAmount, 0)) as amount_pending,
        
        -- Calculate carry forward from previous month (exactly like doctor salary)
        COALESCE(
          (SELECT carry_forward_to_next 
           FROM patient_monthly_records pmr
           WHERE pmr.patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
           AND ((pmr.month = ? - 1 AND pmr.year = ?) OR (pmr.month = 12 AND pmr.year = ? - 1 AND ? = 1))
           ORDER BY pmr.id DESC 
           LIMIT 1
          ), 0) as carry_forward,
          
        -- ✅ FIXED: Payment status based on calculated balance, not static balance  
        CASE 
          WHEN (COALESCE(p.fees, 0) + COALESCE(
            CASE 
              WHEN YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) = ?
              THEN COALESCE(p.bloodTest, 0) + COALESCE(p.pickupCharge, 0) + COALESCE(
                (SELECT SUM(tr.amount) 
                 FROM test_reports tr 
                 WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                   AND YEAR(tr.test_date) = ?
                   AND MONTH(tr.test_date) = ?
                   AND tr.status != 'Cancelled'
                ), 0
              )
              ELSE COALESCE(
                (SELECT SUM(tr.amount) 
                 FROM test_reports tr 
                 WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                   AND YEAR(tr.test_date) = ?
                   AND MONTH(tr.test_date) = ?
                   AND tr.status != 'Cancelled'
                ), 0
              )
            END
          ) + COALESCE(
            (SELECT carry_forward_to_next 
             FROM patient_monthly_records pmr
             WHERE pmr.patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
             AND ((pmr.month = ? - 1 AND pmr.year = ?) OR (pmr.month = 12 AND pmr.year = ? - 1 AND ? = 1))
             ORDER BY pmr.id DESC 
             LIMIT 1
            ), 0) - COALESCE(p.payAmount, 0)) <= 0 THEN 'completed'
          ELSE 'pending'
        END as payment_status
      FROM patients p
      WHERE p.status = 'Active'
        AND p.admissionDate IS NOT NULL
        AND (
          YEAR(p.admissionDate) < ? 
          OR (YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) <= ?)
        )
      ORDER BY p.id ASC
      LIMIT ? OFFSET ?
    `, [
      // For month_specific_other_fees CASE statement - admission month check
      targetYear, targetMonth,
      // For month_specific_other_fees CASE WHEN - test reports in selected month
      targetYear, targetMonth,
      // For month_specific_other_fees CASE ELSE - test reports in selected month  
      targetYear, targetMonth,
      // For total_amount CASE statement - admission month check
      targetYear, targetMonth,
      // For total_amount CASE WHEN - test reports in selected month
      targetYear, targetMonth,
      // For total_amount CASE ELSE - test reports in selected month
      targetYear, targetMonth,
      // For amount_pending balance calculation CASE statement - admission month check
      targetYear, targetMonth,
      // For amount_pending balance calculation CASE WHEN - test reports in selected month
      targetYear, targetMonth,
      // For amount_pending balance calculation CASE ELSE - test reports in selected month
      targetYear, targetMonth,
      // For amount_pending carry_forward calculation - previous month parameters
      targetMonth, targetYear, targetYear, targetMonth,
      // For carry_forward calculation - previous month parameters
      targetMonth, targetYear, targetYear, targetMonth,
      // For payment_status calculation CASE statement - admission month check
      targetYear, targetMonth,
      // For payment_status calculation CASE WHEN - test reports in selected month
      targetYear, targetMonth,
      // For payment_status calculation CASE ELSE - test reports in selected month
      targetYear, targetMonth,
      // For payment_status carry_forward calculation - previous month parameters
      targetMonth, targetYear, targetYear, targetMonth,
      // For amount_paid calculation - month-specific payments
      targetYear, targetMonth,
      // For WHERE clause - admission date filtering
      targetYear, targetYear, targetMonth,
      // For pagination
      parseInt(limit), offset
    ]);

    // Get total count for pagination - also filtered by admission date
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM patients p
      WHERE p.status = 'Active'
        AND p.admissionDate IS NOT NULL
        AND (
          YEAR(p.admissionDate) < ? 
          OR (YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) <= ?)
        )
    `, [targetYear, targetYear, targetMonth]);

    // Get stats for active patients based on selected month/year
    // Only count patients who were admitted in or before the selected month/year
    // Use month-specific other fees from test reports
    const [statsResult] = await db.execute(`
      SELECT 
        COUNT(*) as totalPatients,
        COALESCE(SUM(COALESCE(p.fees, 0)), 0) as totalMonthlyFees,
        COALESCE(SUM(
          -- If current month/year matches admission month/year, include blood test + pickup charges + test reports
          CASE 
            WHEN YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) = ?
            THEN COALESCE(p.bloodTest, 0) + COALESCE(p.pickupCharge, 0) + COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
            -- For other months, only include test reports
            ELSE COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
          END
        ), 0) as totalTestReportAmount,
        COALESCE(SUM(p.payAmount), 0) as totalPaid,
        COALESCE(SUM(p.balance), 0) as totalPending
      FROM patients p
      WHERE p.status = 'Active' 
        AND p.admissionDate IS NOT NULL
        AND (
          YEAR(p.admissionDate) < ? 
          OR (YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) <= ?)
        )
    `, [
      // For totalTestReportAmount CASE statement - admission month check
      targetYear, targetMonth,
      // For totalTestReportAmount CASE WHEN - test reports in selected month
      targetYear, targetMonth,
      // For totalTestReportAmount CASE ELSE - test reports in selected month
      targetYear, targetMonth,
      // For WHERE clause - admission date filtering
      targetYear, targetYear, targetMonth
    ]);

    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));
    const stats = statsResult[0] || {
      totalPatients: 0,
      totalTestReportAmount: 0,
      totalPaid: 0,
      totalPending: 0
    };

    console.log(`✅ Found ${patients.length} active patients for payment management`);
    console.log('📋 Sample patient data:', patients.length > 0 ? patients[0] : 'No patients');
    console.log('📊 Stats data:', stats);

    res.json({
      success: true,
      payments: patients,
      stats,
      totalPages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching patient payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient payments',
      error: error.message
    });
  }
});

// Get payment history for a specific patient
router.get('/patient-payments/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const [history] = await db.execute(`
      SELECT 
        pph.*,
        p.name as patient_name
      FROM patient_payment_history pph
      LEFT JOIN patients p ON p.id = pph.patient_id
      WHERE pph.patient_id = ?
      ORDER BY pph.payment_date DESC
    `, [patientId]);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});



// Record a payment for a patient
router.post('/patient-payments/record-payment', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { patientId, amount, method, notes, month, year } = req.body;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Insert payment history record
    await connection.execute(`
      INSERT INTO patient_payment_history (
        patient_id, payment_amount, payment_method, payment_date, notes
      ) VALUES (?, ?, ?, CURDATE(), ?)
    `, [patientId, amount, method, notes || '']);

    // Update the monthly record - simplified to avoid column issues
    await connection.execute(`
      UPDATE patient_monthly_records 
      SET 
        amount_paid = COALESCE(amount_paid, 0) + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = ? AND month = ? AND year = ?
    `, [amount, patientId, targetMonth, targetYear]);

    await connection.commit();
    
    res.json({
      success: true,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  } finally {
    connection.release();
  }
});




// Auto-run carry forward for patients (similar to staff)
router.post('/patient-payments/auto-carry-forward/:month/:year', async (req, res) => {
  let connection;
  try {
    const { month, year } = req.params;
    console.log(`🔄 Auto-running carry forward for patients ${month}/${year}...`);

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Calculate previous month/year
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = parseInt(year) - 1;
    }

    // Get all active patients with their payment data
    const [patients] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        CONCAT('P', LPAD(p.id, 4, '0')) as patient_id,
        COALESCE(p.fees, 0) as fees,
        
        -- Calculate month-specific other fees
        COALESCE(
          CASE 
            WHEN YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) = ?
            THEN COALESCE(p.bloodTest, 0) + COALESCE(p.pickupCharge, 0) + COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
            ELSE COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
          END
        ) as month_specific_other_fees,
        
        COALESCE(
          (SELECT SUM(amount_paid) 
           FROM patient_payment_history 
           WHERE patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
           AND MONTH(payment_date) = ? 
           AND YEAR(payment_date) = ?
          ), 0
        ) as total_paid_this_month,
        
        COALESCE(
          (SELECT carry_forward_to_next 
           FROM patient_monthly_records 
           WHERE patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
           AND month = ? AND year = ?
           LIMIT 1
          ), 0
        ) as carry_forward_from_previous
        
      FROM patients p
      WHERE p.status = 'Active'
      ORDER BY p.id ASC
    `, [
      year, month,           // admission month check
      year, month,           // test reports for admission month
      year, month,           // test reports for other months
      year, month,           // test reports for other months (second case)
      month, year,           // total_paid_this_month
      prevMonth, prevYear    // carry_forward_from_previous
    ]);

    console.log(`📊 Auto-processing ${patients.length} patients...`);

    for (const patient of patients) {
      // Calculate balance for this month
      const monthlyFees = parseFloat(patient.fees) || 0;
      const otherFees = parseFloat(patient.month_specific_other_fees) || 0;
      const totalAmount = monthlyFees + otherFees;
      const totalPaid = parseFloat(patient.total_paid_this_month) || 0;
      const carryForwardFromPrevious = parseFloat(patient.carry_forward_from_previous) || 0;
      
      // Net Balance = Total Amount + Carry Forward From Previous - Total Paid
      const netBalance = totalAmount + carryForwardFromPrevious - totalPaid;
      
      // Carry forward to next month (only positive balances)
      const carryForwardToNext = netBalance > 0 ? netBalance : 0;
      
      // Check if record already exists for this patient, month, year
      const [existingRecord] = await connection.execute(`
        SELECT id FROM patient_monthly_records 
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [patient.patient_id, month, year]);
      
      // Prepare record data for basic columns only
      console.log(`💳 Processing patient ${patient.name} (${patient.patient_id}) - Amount: ₹${totalAmount}, Paid: ₹${totalPaid}, Balance: ₹${netBalance}`);
      console.log(`🔄 Carry Forward - From Previous: ₹${carryForwardFromPrevious}, To Next: ₹${carryForwardToNext}`);
      
      if (existingRecord.length > 0) {
        // Update existing record - using simplified columns
        const updateData = [
          totalAmount,                  // total_amount
          totalPaid,                    // amount_paid
          carryForwardFromPrevious,     // carry_forward_from_previous
          carryForwardToNext,           // carry_forward_to_next
          netBalance,                   // net_balance
          netBalance <= 0 ? 'completed' : 'pending',  // payment_status
          patient.patient_id,
          month,
          year
        ];
        
        await connection.execute(`
          UPDATE patient_monthly_records 
          SET patient_fees = ?, other_fees = ?, total_amount = ?, amount_paid = ?, 
              carry_forward_from_previous = ?, carry_forward_to_next = ?, 
              net_balance = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ? AND month = ? AND year = ?
        `, [monthlyFees, otherFees, ...updateData]);
        
        console.log(`📝 Updated record for ${patient.name}: Balance ${netBalance.toFixed(2)}, Carry Forward: ${carryForwardToNext.toFixed(2)}`);
      } else {
        // Insert new record - using simplified columns
        const insertData = [
          patient.patient_id,
          month,
          year,
          totalAmount,                  // total_amount
          totalPaid,                    // amount_paid
          carryForwardFromPrevious,     // carry_forward_from_previous
          carryForwardToNext,           // carry_forward_to_next
          netBalance,                   // net_balance
          netBalance <= 0 ? 'completed' : 'pending'  // payment_status
        ];
        
        await connection.execute(`
          INSERT INTO patient_monthly_records 
          (patient_id, month, year, patient_fees, other_fees, total_amount, amount_paid,
           carry_forward_from_previous, carry_forward_to_next, net_balance, 
           payment_status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [patient.patient_id, month, year, monthlyFees, otherFees, ...insertData.slice(3)]);
        
        console.log(`📝 Created record for ${patient.name}: Balance ${netBalance.toFixed(2)}, Carry Forward: ${carryForwardToNext.toFixed(2)}`);
      }
    }

    await connection.commit();
    console.log('✅ Patient auto carry forward completed successfully');

    res.json({
      success: true,
      message: `Auto carry forward completed for patients ${month}/${year}`,
      processed: patients.length
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error in patient auto carry forward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute auto carry forward',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Save monthly records for patients (similar to doctor salary)
// Save monthly records and carry forward balances (mirrored from doctor-salary.js)
router.post('/patient-payments/save-monthly-records', async (req, res) => {
  console.log('🔥 PATIENT PAYMENTS: Save Monthly Records endpoint hit!');
  console.log('📦 Request body:', req.body);
  
  const connection = await db.getConnection();
  
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    console.log(`💾 Saving patient monthly records for ${month}/${year} with automatic carry forward...`);
    console.log(`🗓️ Applying admission date filter: only patients admitted before or during ${month}/${year}`);
    
    await connection.beginTransaction();

    // Calculate previous month and year for carry forward (exactly like doctor salary)
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }
    
    // Get all active patients with their payment data using the SAME calculation logic as the main GET endpoint
    console.log('🔍 Using the SAME month-specific calculation logic as the main GET endpoint...');
    
    const patientsQuery = `
      SELECT 
        p.id,
        p.name,
        CONCAT('P', LPAD(p.id, 4, '0')) as patient_id,
        COALESCE(p.monthlyFees, p.fees, 0) as patient_fees,
        
        -- Use the EXACT SAME month-specific other fees calculation as the main GET endpoint
        COALESCE(
          -- If current month/year matches admission month/year, include blood test + pickup charges + test reports
          CASE 
            WHEN YEAR(p.admissionDate) = ? AND MONTH(p.admissionDate) = ?
            THEN COALESCE(p.bloodTest, 0) + COALESCE(p.pickupCharge, 0) + COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
            -- For other months, only include test reports
            ELSE COALESCE(
              (SELECT SUM(tr.amount) 
               FROM test_reports tr 
               WHERE (tr.patient_id = CONCAT('P', LPAD(p.id, 4, '0')) OR tr.patient_id = p.id)
                 AND YEAR(tr.test_date) = ?
                 AND MONTH(tr.test_date) = ?
                 AND tr.status != 'Cancelled'
              ), 0
            )
          END
        ) as other_fees,
        
        p.admissionDate,
        0 as total_paid_this_month,
        
        -- Calculate carry forward from previous month
        COALESCE(
          (SELECT carry_forward_to_next 
           FROM patient_monthly_records 
           WHERE patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
           AND month = ? 
           AND year = ?
           LIMIT 1
          ), 0) as carry_forward_from_previous
      FROM patients p
      WHERE p.status = 'Active'
      AND p.admissionDate IS NOT NULL
      AND p.admissionDate <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
      ORDER BY p.id ASC
    `;

    const [patients] = await connection.execute(patientsQuery, [
      // For other_fees CASE statement - admission month check
      year, month,
      // For other_fees CASE WHEN - test reports in selected month
      year, month,
      // For other_fees CASE ELSE - test reports in selected month  
      year, month,
      // For carry forward from previous month
      prevMonth, prevYear,
      // For admission date filtering
      year, month
    ]);

    console.log(`👥 Found ${patients.length} eligible patients for ${month}/${year} (after admission date filtering):`);
    patients.forEach(patient => {
      console.log(`  - ${patient.name} (${patient.patient_id}): admitted ${patient.admissionDate || 'N/A'}`);
    });

    let recordsProcessed = 0;
    let carryForwardUpdates = 0;
    
    for (const patient of patients) {
      // Calculate balance for this month using the SAME field names as the query
      const monthlyFees = parseFloat(patient.patient_fees) || 0;
      const otherFees = parseFloat(patient.other_fees) || 0;
      const totalAmount = monthlyFees + otherFees;
      const totalPaid = parseFloat(patient.total_paid_this_month) || 0;
      const carryForwardFromPrevious = parseFloat(patient.carry_forward_from_previous) || 0;
      
      // Current month's balance = Total Amount - Total Paid (for this month only)
      const currentMonthBalance = totalAmount - totalPaid;
      
      // Net Balance = Current Month Balance + Carry Forward From Previous
      const netBalance = currentMonthBalance + carryForwardFromPrevious;
      
      // ✅ FIXED: Only carry forward the BALANCE amount to next month, not total amount
      // Carry forward to next month = only the unpaid balance (positive balances only)
      const carryForwardToNext = netBalance > 0 ? netBalance : 0;
      
      console.log(`💰 ${patient.name}: Fees=₹${monthlyFees}, Other=₹${otherFees}, Total=₹${totalAmount}, Paid=₹${totalPaid}, CurrentBalance=₹${currentMonthBalance}, PrevCarryFwd=₹${carryForwardFromPrevious}, NetBalance=₹${netBalance}, NextCarryFwd=₹${carryForwardToNext}`);
      
      // Check if record already exists for this patient, month, year
      const [existingRecord] = await connection.execute(`
        SELECT id FROM patient_monthly_records 
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [patient.patient_id, month, year]);

      if (existingRecord.length > 0) {
        // Update existing record with all fee columns properly mapped
        await connection.execute(`
          UPDATE patient_monthly_records 
          SET 
            patient_fees = ?,
            other_fees = ?,
            total_amount = ?,
            amount_paid = ?,
            carry_forward_from_previous = ?,
            carry_forward_to_next = ?,
            net_balance = ?,
            balance = ?,
            carry_forward = ?,
            payment_status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ? AND month = ? AND year = ?
        `, [
          monthlyFees, otherFees, totalAmount, totalPaid, 
          carryForwardFromPrevious, carryForwardToNext, netBalance,
          netBalance, carryForwardToNext, // Map to old column names too
          netBalance <= 0 ? 'completed' : 'pending', 
          patient.patient_id, month, year
        ]);
        console.log(`📝 Updated record for ${patient.name}: Balance = ₹${netBalance.toFixed(2)}`);
      } else {
        // Insert new record with all fee columns properly mapped
        await connection.execute(`
          INSERT INTO patient_monthly_records (
            patient_id, month, year, patient_fees, other_fees, total_amount, 
            amount_paid, carry_forward_from_previous, carry_forward_to_next, 
            net_balance, balance, carry_forward, payment_status, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          patient.patient_id, month, year, 
          monthlyFees, otherFees, totalAmount, 
          totalPaid, carryForwardFromPrevious, carryForwardToNext, 
          netBalance, netBalance, carryForwardToNext, // Map to old column names too
          netBalance <= 0 ? 'completed' : 'pending'
        ]);
        console.log(`✅ Created record for ${patient.name}: Balance = ₹${netBalance.toFixed(2)}`);
      }
      
      // Log carry forward information (exactly like doctor salary)
      if (carryForwardToNext > 0) {
        console.log(`📋 Patient ${patient.name}: Balance ₹${netBalance.toFixed(2)} will carry forward to next month`);
        carryForwardUpdates++;
      }
      
      recordsProcessed++;
    }
    
    await connection.commit();
    
    console.log(`✅ Successfully processed ${recordsProcessed} patient monthly records for ${month}/${year}`);
    console.log(`💰 ${carryForwardUpdates} patients have balances carrying forward to next month`);
    
    res.json({
      success: true,
      message: `Monthly records saved successfully for ${month}/${year}`,
      recordsProcessed,
      carryForwardUpdates,
      month,
      year
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error saving patient monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly records',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get carry forward information for next month (exactly like doctor salary)
router.get('/carry-forward/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    console.log(`📋 Getting carry forward info for ${month}/${year}`);
    
    const query = `
      SELECT 
        p.id,
        p.name as patient_name,
        pmr.carry_forward_to_next as carry_forward_amount,
        pmr.net_balance,
        pmr.payment_status as monthly_status
      FROM patients p
      LEFT JOIN patient_monthly_records pmr ON p.id = pmr.patient_id 
        AND pmr.month = ? AND pmr.year = ?
      WHERE p.status = 'Active' AND pmr.carry_forward_to_next > 0
      ORDER BY p.name ASC
    `;
    
    const [rows] = await db.execute(query, [month, year]);
    
    console.log(`✅ Found ${rows.length} patients with carry forward amounts`);
    res.json({
      success: true,
      data: rows,
      totalCarryForward: rows.reduce((sum, patient) => sum + parseFloat(patient.carry_forward_amount || 0), 0)
    });
    
  } catch (error) {
    console.error('❌ Error fetching carry forward info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch carry forward information',
      error: error.message
    });
  }
});

export default router;
