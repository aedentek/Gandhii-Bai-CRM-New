import express from 'express';
import db from '../db/config.js';

const router = express.Router();

console.log('🏥 Patient Fees routes module loaded!');

// Get all patients for fees management (with payment data for current month)
router.get('/patient-fees', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Calculate previous month/year for carry forward
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = targetYear - 1;
    }

    console.log(`📋 Getting patient fees data for ${targetMonth}/${targetYear}`);

    // Check if patient_test_reports table exists
    const [testReportTableCheck] = await db.execute("SHOW TABLES LIKE 'patient_test_reports'");
    const testReportTableExists = testReportTableCheck.length > 0;
    console.log(`🔍 Patient test reports table exists: ${testReportTableExists}`);

    let query;
    let queryParams = [];

    if (testReportTableExists) {
      // Enhanced query with patient_test_reports integration and monthly fees tracking
      query = `
        SELECT 
          p.id,
          p.name,
          p.phone,
          p.email,
          COALESCE(pmf.monthly_fees, p.fees, 0) as fees,
          COALESCE(pmf.total_paid, 0) as monthly_paid,
          COALESCE(
            (SELECT SUM(payment_amount) 
             FROM patient_fee_settlements 
             WHERE patient_id = p.id 
             AND MONTH(payment_date) = ? 
             AND YEAR(payment_date) = ?
            ), 0) as total_paid,
          COALESCE(
            (SELECT SUM(amount) 
             FROM patient_test_reports 
             WHERE patient_id = p.id 
             AND MONTH(test_date) = ? 
             AND YEAR(test_date) = ?
            ), 0) as test_report_amount,
          COALESCE(
            (SELECT carry_forward_to_next 
             FROM patient_monthly_fees 
             WHERE patient_id = p.id 
             AND month = ? AND year = ?
             LIMIT 1
            ), 0) as carry_forward,
          COALESCE(pmf.net_balance, 
            (COALESCE(pmf.monthly_fees, p.fees, 0) + 
              COALESCE(
                (SELECT carry_forward_to_next 
                 FROM patient_monthly_fees 
                 WHERE patient_id = p.id 
                 AND month = ? AND year = ?
                 LIMIT 1
                ), 0) - 
              COALESCE(
                (SELECT SUM(payment_amount) 
                 FROM patient_fee_settlements 
                 WHERE patient_id = p.id 
                 AND MONTH(payment_date) = ? 
                 AND YEAR(payment_date) = ?
                ), 0) -
              COALESCE(
                (SELECT SUM(amount) 
                 FROM patient_test_reports 
                 WHERE patient_id = p.id 
                 AND MONTH(test_date) = ? 
                 AND YEAR(test_date) = ?
                ), 0)
            )) as balance,
          'Bank Transfer' as payment_mode,
          CASE 
            WHEN pmf.net_balance > 0 THEN 'Pending'
            WHEN pmf.net_balance = 0 THEN 'Paid'
            ELSE 'Overpaid'
          END as status,
          p.photo,
          p.admission_date as join_date
        FROM patients p
        LEFT JOIN patient_monthly_fees pmf ON p.id = pmf.patient_id 
          AND pmf.month = ? AND pmf.year = ?
        WHERE p.status = 'active'
        ORDER BY p.id ASC
      `;
      
      queryParams = [
        targetMonth, targetYear,  // total_paid subquery
        targetMonth, targetYear,  // test_report_amount subquery  
        prevMonth, prevYear,      // carry_forward subquery (from previous month)
        prevMonth, prevYear,      // carry_forward in balance calculation
        targetMonth, targetYear,  // total_paid in balance calculation
        targetMonth, targetYear,  // test_report_amount in balance calculation
        targetMonth, targetYear   // main LEFT JOIN
      ];
    } else {
      console.log('⚠️ patient_test_reports table not found, using simplified query');
      
      query = `
        SELECT 
          p.id,
          p.name,
          p.phone,
          p.email,
          COALESCE(pmf.monthly_fees, p.fees, 0) as fees,
          COALESCE(pmf.total_paid, 0) as monthly_paid,
          COALESCE(
            (SELECT SUM(payment_amount) 
             FROM patient_fee_settlements 
             WHERE patient_id = p.id 
             AND MONTH(payment_date) = ? 
             AND YEAR(payment_date) = ?
            ), 0) as total_paid,
          0 as test_report_amount,
          COALESCE(
            (SELECT carry_forward_to_next 
             FROM patient_monthly_fees 
             WHERE patient_id = p.id 
             AND month = ? AND year = ?
             LIMIT 1
            ), 0) as carry_forward,
          COALESCE(pmf.net_balance, 
            (COALESCE(pmf.monthly_fees, p.fees, 0) + 
              COALESCE(
                (SELECT carry_forward_to_next 
                 FROM patient_monthly_fees 
                 WHERE patient_id = p.id 
                 AND month = ? AND year = ?
                 LIMIT 1
                ), 0) - 
              COALESCE(
                (SELECT SUM(payment_amount) 
                 FROM patient_fee_settlements 
                 WHERE patient_id = p.id 
                 AND MONTH(payment_date) = ? 
                 AND YEAR(payment_date) = ?
                ), 0)
            )) as balance,
          'Bank Transfer' as payment_mode,
          CASE 
            WHEN pmf.net_balance > 0 THEN 'Pending'
            WHEN pmf.net_balance = 0 THEN 'Paid'
            ELSE 'Overpaid'
          END as status,
          p.photo,
          p.admission_date as join_date
        FROM patients p
        LEFT JOIN patient_monthly_fees pmf ON p.id = pmf.patient_id 
          AND pmf.month = ? AND pmf.year = ?
        WHERE p.status = 'active'
        ORDER BY p.id ASC
      `;
      
      queryParams = [
        targetMonth, targetYear,  // total_paid subquery
        prevMonth, prevYear,      // carry_forward subquery (from previous month)
        prevMonth, prevYear,      // carry_forward in balance calculation
        targetMonth, targetYear,  // total_paid in balance calculation
        targetMonth, targetYear   // main LEFT JOIN
      ];
    }

    const [rows] = await db.execute(query, queryParams);
    
    console.log(`✅ Found ${rows.length} patients for fees management`);

    res.json({
      success: true,
      data: rows,
      month: targetMonth,
      year: targetYear
    });

  } catch (error) {
    console.error('❌ Error fetching patient fees:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch patient fees data',
      error: error.message 
    });
  }
});

// Record patient fee payment
router.post('/record-payment', async (req, res) => {
  try {
    const { patientId, amount, date, type, payment_mode = 'Bank Transfer' } = req.body;

    console.log('💳 Recording patient fee payment:', { patientId, amount, date, type, payment_mode });

    if (!patientId || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, amount, and date are required'
      });
    }

    // Create patient_fee_settlements table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS patient_fee_settlements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id VARCHAR(50) NOT NULL,
        payment_amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
        type VARCHAR(50) DEFAULT 'fees',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_payment_date (payment_date)
      )
    `);

    // Insert payment record
    const [result] = await db.execute(
      `INSERT INTO patient_fee_settlements 
       (patient_id, payment_amount, payment_date, payment_mode, type, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patientId, amount, date, payment_mode, type, `Payment recorded for ${type}`]
    );

    console.log(`✅ Payment recorded successfully with ID: ${result.insertId}`);

    // Update patient monthly fees if exists
    const paymentDate = new Date(date);
    const month = paymentDate.getMonth() + 1;
    const year = paymentDate.getFullYear();

    try {
      await db.execute(`
        UPDATE patient_monthly_fees 
        SET total_paid = total_paid + ?, 
            net_balance = monthly_fees + carry_forward_from_prev - (total_paid + ?),
            updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [amount, amount, patientId, month, year]);
    } catch (updateError) {
      console.log('⚠️ Could not update monthly fees record (might not exist yet):', updateError.message);
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: result.insertId
    });

  } catch (error) {
    console.error('❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

// Get payment history for a patient
router.get('/payment-history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log(`📋 Getting payment history for patient: ${patientId}`);

    // Create patient_fee_settlements table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS patient_fee_settlements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id VARCHAR(50) NOT NULL,
        payment_amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
        type VARCHAR(50) DEFAULT 'fees',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_payment_date (payment_date)
      )
    `);

    const [payments] = await db.execute(
      `SELECT 
        id,
        patient_id,
        payment_amount,
        payment_date,
        payment_mode,
        type,
        notes,
        created_at
      FROM patient_fee_settlements 
      WHERE patient_id = ?
      ORDER BY payment_date DESC, created_at DESC`,
      [patientId]
    );

    console.log(`✅ Found ${payments.length} payment records for patient ${patientId}`);

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

// Delete payment record
router.delete('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log(`🗑️ Deleting payment record: ${paymentId}`);

    // Get payment details before deletion for rollback calculation
    const [paymentDetails] = await db.execute(
      'SELECT * FROM patient_fee_settlements WHERE id = ?',
      [paymentId]
    );

    if (paymentDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const payment = paymentDetails[0];

    // Delete the payment record
    const [result] = await db.execute(
      'DELETE FROM patient_fee_settlements WHERE id = ?',
      [paymentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update monthly fees if exists
    const paymentDate = new Date(payment.payment_date);
    const month = paymentDate.getMonth() + 1;
    const year = paymentDate.getFullYear();

    try {
      await db.execute(`
        UPDATE patient_monthly_fees 
        SET total_paid = total_paid - ?, 
            net_balance = monthly_fees + carry_forward_from_prev - (total_paid - ?),
            updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [payment.payment_amount, payment.payment_amount, payment.patient_id, month, year]);
    } catch (updateError) {
      console.log('⚠️ Could not update monthly fees record:', updateError.message);
    }

    console.log(`✅ Payment record deleted successfully`);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
});

// Check and update carry forward amounts
router.post('/check-carry-forward', async (req, res) => {
  try {
    const { month, year } = req.body;
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    console.log(`🔄 Checking carry forward for ${targetMonth}/${targetYear}`);

    // Calculate previous month/year
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = targetYear - 1;
    }

    // Create patient_monthly_fees table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS patient_monthly_fees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id VARCHAR(50) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        monthly_fees DECIMAL(10,2) NOT NULL DEFAULT 0,
        carry_forward_from_prev DECIMAL(10,2) NOT NULL DEFAULT 0,
        carry_forward_to_next DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
        net_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_patient_month_year (patient_id, month, year),
        INDEX idx_month_year (month, year)
      )
    `);

    // Get patients with previous month balances that need to be carried forward
    const [prevMonthData] = await db.execute(`
      SELECT patient_id, net_balance 
      FROM patient_monthly_fees 
      WHERE month = ? AND year = ? AND net_balance > 0
    `, [prevMonth, prevYear]);

    let carryForwardUpdates = 0;

    for (const record of prevMonthData) {
      // Update or insert current month record with carry forward
      const [existingRecord] = await db.execute(`
        SELECT id FROM patient_monthly_fees 
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [record.patient_id, targetMonth, targetYear]);

      if (existingRecord.length > 0) {
        // Update existing record
        await db.execute(`
          UPDATE patient_monthly_fees 
          SET carry_forward_from_prev = ?,
              net_balance = monthly_fees + ? - total_paid,
              updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ? AND month = ? AND year = ?
        `, [record.net_balance, record.net_balance, record.patient_id, targetMonth, targetYear]);
      } else {
        // Insert new record with carry forward
        const [patientData] = await db.execute(`
          SELECT fees FROM patients WHERE id = ?
        `, [record.patient_id]);

        const monthlyFees = patientData.length > 0 ? patientData[0].fees || 0 : 0;

        await db.execute(`
          INSERT INTO patient_monthly_fees 
          (patient_id, month, year, monthly_fees, carry_forward_from_prev, net_balance)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [record.patient_id, targetMonth, targetYear, monthlyFees, record.net_balance, monthlyFees + record.net_balance]);
      }

      carryForwardUpdates++;
    }

    console.log(`✅ Updated ${carryForwardUpdates} patient records with carry forward amounts`);

    res.json({
      success: true,
      message: `Carry forward updated for ${carryForwardUpdates} patients`,
      updatedRecords: carryForwardUpdates
    });

  } catch (error) {
    console.error('❌ Error checking carry forward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check carry forward',
      error: error.message
    });
  }
});

// Save monthly records for patients
router.post('/save-monthly-records', async (req, res) => {
  try {
    const { month, year } = req.body;
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    console.log(`💾 Saving monthly records for ${targetMonth}/${targetYear}`);

    // Create patient_monthly_fees table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS patient_monthly_fees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id VARCHAR(50) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        monthly_fees DECIMAL(10,2) NOT NULL DEFAULT 0,
        carry_forward_from_prev DECIMAL(10,2) NOT NULL DEFAULT 0,
        carry_forward_to_next DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
        net_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_patient_month_year (patient_id, month, year),
        INDEX idx_month_year (month, year)
      )
    `);

    // Get all active patients
    const [patients] = await db.execute(`
      SELECT id, fees FROM patients WHERE status = 'active'
    `);

    let recordsProcessed = 0;
    let carryForwardUpdates = 0;

    for (const patient of patients) {
      // Calculate total paid for the month
      const [payments] = await db.execute(`
        SELECT COALESCE(SUM(payment_amount), 0) as total_paid
        FROM patient_fee_settlements 
        WHERE patient_id = ? AND MONTH(payment_date) = ? AND YEAR(payment_date) = ?
      `, [patient.id, targetMonth, targetYear]);

      const totalPaid = payments[0]?.total_paid || 0;
      const monthlyFees = patient.fees || 0;

      // Calculate carry forward from previous month
      let prevMonth = targetMonth - 1;
      let prevYear = targetYear;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear = targetYear - 1;
      }

      const [prevBalance] = await db.execute(`
        SELECT COALESCE(net_balance, 0) as prev_balance
        FROM patient_monthly_fees 
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [patient.id, prevMonth, prevYear]);

      const carryForwardFromPrev = prevBalance[0]?.prev_balance || 0;
      const netBalance = monthlyFees + carryForwardFromPrev - totalPaid;

      // Insert or update monthly record
      try {
        await db.execute(`
          INSERT INTO patient_monthly_fees 
          (patient_id, month, year, monthly_fees, carry_forward_from_prev, total_paid, net_balance, carry_forward_to_next)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          monthly_fees = VALUES(monthly_fees),
          carry_forward_from_prev = VALUES(carry_forward_from_prev),
          total_paid = VALUES(total_paid),
          net_balance = VALUES(net_balance),
          carry_forward_to_next = VALUES(carry_forward_to_next),
          updated_at = CURRENT_TIMESTAMP
        `, [patient.id, targetMonth, targetYear, monthlyFees, carryForwardFromPrev, totalPaid, netBalance, netBalance > 0 ? netBalance : 0]);

        recordsProcessed++;

        if (carryForwardFromPrev > 0) {
          carryForwardUpdates++;
        }

      } catch (insertError) {
        console.error(`❌ Error processing patient ${patient.id}:`, insertError);
      }
    }

    console.log(`✅ Monthly records saved successfully! Processed: ${recordsProcessed}, Carry-forward: ${carryForwardUpdates}`);

    res.json({
      success: true,
      message: `Monthly records saved successfully for ${targetMonth}/${targetYear}`,
      recordsProcessed,
      carryForwardUpdates
    });

  } catch (error) {
    console.error('❌ Error saving monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly records',
      error: error.message
    });
  }
});

export default router;
