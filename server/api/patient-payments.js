import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Database connection config
const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

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
    const [patients] = await pool.execute(`
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
        
        COALESCE(p.payAmount, 0) as amount_paid,
        COALESCE(p.balance, 0) as amount_pending,
        0 as carry_forward,
        CASE 
          WHEN COALESCE(p.balance, 0) <= 0 THEN 'completed'
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
      // For WHERE clause - admission date filtering
      targetYear, targetYear, targetMonth,
      // For pagination
      parseInt(limit), offset
    ]);

    // Get total count for pagination - also filtered by admission date
    const [countResult] = await pool.execute(`
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
    const [statsResult] = await pool.execute(`
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
    
    const [history] = await pool.execute(`
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

// Save monthly records for all patients
router.post('/patient-payments/save-monthly-records', async (req, res) => {
  try {
    const { month, year } = req.body;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Call the stored procedure
    await pool.execute(`CALL SaveMonthlyPatientRecords(?, ?)`, [targetMonth, targetYear]);

    res.json({
      success: true,
      message: 'Monthly records saved successfully'
    });
  } catch (error) {
    console.error('Error saving monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly records',
      error: error.message
    });
  }
});

// Record a payment for a patient
router.post('/patient-payments/record-payment', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { patient_id, amount_paid, payment_method, notes, month, year } = req.body;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Insert payment history record
    await connection.execute(`
      INSERT INTO patient_payment_history (
        patient_id, amount_paid, payment_method, payment_date, notes
      ) VALUES (?, ?, ?, CURDATE(), ?)
    `, [patient_id, amount_paid, payment_method, notes || '']);

    // Update the monthly record
    await connection.execute(`
      UPDATE patient_payment_records 
      SET 
        amount_paid = amount_paid + ?,
        amount_pending = GREATEST(0, total_amount - (amount_paid + ?)),
        payment_status = CASE 
          WHEN (amount_paid + ?) >= total_amount THEN 'completed'
          WHEN (amount_paid + ?) > 0 THEN 'partial'
          ELSE 'pending'
        END,
        payment_method = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = ? AND month = ? AND year = ?
    `, [amount_paid, amount_paid, amount_paid, amount_paid, payment_method, patient_id, targetMonth, targetYear]);

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

// Save monthly records and carry forward balances (similar to staff salary)
router.post('/patient-payments/save-monthly-records/:month/:year', async (req, res) => {
  let connection;
  try {
    const { month, year } = req.params;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    console.log(`💾 Saving patient monthly records for ${month}/${year} with automatic carry forward...`);
    
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Calculate previous month/year for carry forward
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
        p.admissionDate,
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
        
        -- Get payments made in this month
        COALESCE(
          (SELECT SUM(amount_paid) 
           FROM patient_payment_history 
           WHERE patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
           AND MONTH(payment_date) = ? 
           AND YEAR(payment_date) = ?
          ), 0
        ) as total_paid_this_month,
        
        -- Get carry forward from previous month
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
      AND p.admissionDate <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
      ORDER BY p.id ASC
    `, [
      year, month,           // admission month check
      year, month,           // test reports for admission month
      year, month,           // test reports for other months
      year, month,           // test reports for other months (second case)
      month, year,           // total_paid_this_month
      prevMonth, prevYear,   // carry_forward_from_previous
      year, month            // admission date filter
    ]);

    console.log(`📊 Processing ${patients.length} patients...`);

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
      
      const recordData = [
        monthlyFees,                  // monthly_fees
        otherFees,                    // other_fees
        totalAmount,                  // total_amount
        totalPaid,                    // amount_paid
        netBalance > 0 ? netBalance : 0,  // amount_pending
        carryForwardFromPrevious,     // carry_forward_from_previous
        carryForwardToNext,           // carry_forward_to_next
        netBalance,                   // net_balance
        netBalance <= 0 ? 'completed' : 'pending',  // payment_status
        patient.patient_id,
        month,
        year
      ];
      
      if (existingRecord.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE patient_monthly_records 
          SET monthly_fees = ?, other_fees = ?, total_amount = ?, 
              amount_paid = ?, amount_pending = ?, 
              carry_forward_from_previous = ?, carry_forward_to_next = ?, 
              net_balance = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ? AND month = ? AND year = ?
        `, recordData);
        
        console.log(`📝 Updated record for ${patient.name}: Balance = ₹${netBalance.toFixed(2)}`);
      } else {
        // Insert new record
        await connection.execute(`
          INSERT INTO patient_monthly_records 
          (monthly_fees, other_fees, total_amount, amount_paid, amount_pending,
           carry_forward_from_previous, carry_forward_to_next, net_balance, 
           payment_status, patient_id, month, year, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, recordData);
        
        console.log(`📝 Created record for ${patient.name}: Balance = ₹${netBalance.toFixed(2)}`);
      }
    }

    await connection.commit();
    console.log('✅ Patient monthly records and carry forward completed successfully');

    res.json({
      success: true,
      message: `Monthly records and carry forward completed for ${month}/${year}`,
      processed: patients.length
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error in patient monthly records save:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly records',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Auto-run carry forward for patients (similar to staff)
router.post('/patient-payments/auto-carry-forward/:month/:year', async (req, res) => {
  let connection;
  try {
    const { month, year } = req.params;
    console.log(`🔄 Auto-running carry forward for patients ${month}/${year}...`);

    connection = await pool.getConnection();
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
      
      const recordData = [
        monthlyFees,                  // monthly_fees
        otherFees,                    // other_fees
        totalAmount,                  // total_amount
        totalPaid,                    // amount_paid
        netBalance > 0 ? netBalance : 0,  // amount_pending
        carryForwardFromPrevious,     // carry_forward_from_previous
        carryForwardToNext,           // carry_forward_to_next
        netBalance,                   // net_balance
        netBalance <= 0 ? 'completed' : 'pending',  // payment_status
        patient.patient_id,
        month,
        year
      ];
      
      if (existingRecord.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE patient_monthly_records 
          SET monthly_fees = ?, other_fees = ?, total_amount = ?, 
              amount_paid = ?, amount_pending = ?, 
              carry_forward_from_previous = ?, carry_forward_to_next = ?, 
              net_balance = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ? AND month = ? AND year = ?
        `, recordData);
        
        console.log(`📝 Updated record for ${patient.name}: Balance ${netBalance.toFixed(2)}, Carry Forward: ${carryForwardToNext.toFixed(2)}`);
      } else {
        // Insert new record
        await connection.execute(`
          INSERT INTO patient_monthly_records 
          (monthly_fees, other_fees, total_amount, amount_paid, amount_pending,
           carry_forward_from_previous, carry_forward_to_next, net_balance, 
           payment_status, patient_id, month, year, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, recordData);
        
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

export default router;
