const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all patient payments with pagination and filtering
router.get('/all', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Build the query based on filters
    let query = `
      SELECT 
        p.id,
        p.id as patient_id,
        p.name,
        p.email,
        p.phone,
        p.registrationId as registration_id,
        COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) as test_report_amount,
        COALESCE(ppr.monthly_paid, 0) as monthly_paid,
        COALESCE(ppr.total_paid, 0) as total_paid,
        COALESCE(ppr.carry_forward, 0) as carry_forward,
        COALESCE(ppr.balance, COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) - COALESCE(p.payAmount, 0)) as balance,
        COALESCE(p.paymentType, 'Cash') as payment_mode,
        CASE 
          WHEN COALESCE(ppr.balance, COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) - COALESCE(p.payAmount, 0)) <= 0 THEN 'Paid'
          ELSE 'Pending'
        END as status,
        p.photo,
        p.admissionDate as admission_date,
        COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) as total_fees
      FROM patients p
      LEFT JOIN patient_payment_records ppr ON p.id = ppr.patient_id 
        AND ppr.month = ? AND ppr.year = ?
      WHERE p.status = 'Active'
      ORDER BY p.id ASC
    `;
    
    const values = [month || new Date().getMonth() + 1, year || new Date().getFullYear()];
    
    const [rows] = await db.execute(query, values);
    
    res.json({
      success: true,
      data: rows,
      message: 'Patient payments retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching patient payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient payments',
      error: error.message
    });
  }
});

// Get payment history for a specific patient
router.get('/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { month, year } = req.query;
    
    const query = `
      SELECT 
        id,
        payment_date,
        payment_amount,
        payment_mode,
        type,
        notes,
        created_at
      FROM patient_payment_history 
      WHERE patient_id = ? 
        AND MONTH(payment_date) = ? 
        AND YEAR(payment_date) = ?
      ORDER BY payment_date DESC
    `;
    
    const [rows] = await db.execute(query, [
      patientId, 
      month || new Date().getMonth() + 1, 
      year || new Date().getFullYear()
    ]);
    
    res.json({
      success: true,
      data: rows,
      message: 'Payment history retrieved successfully'
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

// Save monthly records with carry forward functionality
router.post('/save-monthly-records', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    await connection.beginTransaction();
    
    // Get all patients with their current payment status
    const [patients] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) as total_fees,
        COALESCE(p.payAmount, 0) as advance_paid,
        COALESCE(ppr.total_paid, 0) as current_total_paid,
        COALESCE(ppr.carry_forward, 0) as current_carry_forward,
        COALESCE(ppr.balance, COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) - COALESCE(p.payAmount, 0)) as current_balance
      FROM patients p
      LEFT JOIN patient_payment_records ppr ON p.id = ppr.patient_id 
        AND ppr.month = ? AND ppr.year = ?
    `, [month, year]);
    
    let recordsProcessed = 0;
    let carryForwardUpdates = 0;
    
    for (const patient of patients) {
      const currentBalance = parseFloat(patient.current_balance) || 0;
      
      // Check if record already exists
      const [existingRecord] = await connection.execute(`
        SELECT id FROM patient_payment_records 
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [patient.id, month, year]);
      
      if (existingRecord.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE patient_payment_records 
          SET 
            total_fees = ?,
            balance = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE patient_id = ? AND month = ? AND year = ?
        `, [
          patient.total_fees,
          currentBalance,
          patient.id,
          month,
          year
        ]);
      } else {
        // Create new record
        await connection.execute(`
          INSERT INTO patient_payment_records 
          (patient_id, month, year, total_fees, total_paid, carry_forward, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          patient.id,
          month,
          year,
          patient.total_fees,
          patient.current_total_paid,
          patient.current_carry_forward,
          currentBalance
        ]);
      }
      
      recordsProcessed++;
      
      // If there's a balance, prepare carry forward for next month
      if (currentBalance > 0) {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        
        // Check if next month record exists
        const [nextMonthRecord] = await connection.execute(`
          SELECT id FROM patient_payment_records 
          WHERE patient_id = ? AND month = ? AND year = ?
        `, [patient.id, nextMonth, nextYear]);
        
        if (nextMonthRecord.length === 0) {
          // Create next month record with carry forward
          await connection.execute(`
            INSERT INTO patient_payment_records 
            (patient_id, month, year, total_fees, carry_forward, balance, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            patient.id,
            nextMonth,
            nextYear,
            patient.total_fees,
            currentBalance,
            patient.total_fees + currentBalance
          ]);
          
          carryForwardUpdates++;
        } else {
          // Update existing next month record with carry forward
          await connection.execute(`
            UPDATE patient_payment_records 
            SET 
              carry_forward = carry_forward + ?,
              balance = total_fees + carry_forward + ? - total_paid,
              updated_at = CURRENT_TIMESTAMP
            WHERE patient_id = ? AND month = ? AND year = ?
          `, [
            currentBalance,
            currentBalance,
            patient.id,
            nextMonth,
            nextYear
          ]);
          
          carryForwardUpdates++;
        }
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Monthly records saved successfully',
      recordsProcessed,
      carryForwardUpdates
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error saving monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly records',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Record a new payment
router.post('/record-payment', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { 
      patient_id, 
      payment_amount, 
      payment_mode, 
      payment_date, 
      type, 
      notes 
    } = req.body;
    
    if (!patient_id || !payment_amount) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and payment amount are required'
      });
    }
    
    await connection.beginTransaction();
    
    // Insert payment history
    const [paymentResult] = await connection.execute(`
      INSERT INTO patient_payment_history 
      (patient_id, payment_date, payment_amount, payment_mode, type, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      patient_id,
      payment_date || new Date().toISOString().split('T')[0],
      payment_amount,
      payment_mode || 'Cash',
      type || 'fees',
      notes || ''
    ]);
    
    // Update patient payment record
    const month = new Date(payment_date || new Date()).getMonth() + 1;
    const year = new Date(payment_date || new Date()).getFullYear();
    
    // Get current record
    const [currentRecord] = await connection.execute(`
      SELECT * FROM patient_payment_records 
      WHERE patient_id = ? AND month = ? AND year = ?
    `, [patient_id, month, year]);
    
    if (currentRecord.length > 0) {
      // Update existing record
      const newTotalPaid = parseFloat(currentRecord[0].total_paid) + parseFloat(payment_amount);
      const newBalance = parseFloat(currentRecord[0].total_fees) + parseFloat(currentRecord[0].carry_forward) - newTotalPaid;
      
      await connection.execute(`
        UPDATE patient_payment_records 
        SET 
          total_paid = ?,
          balance = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = ? AND month = ? AND year = ?
      `, [newTotalPaid, Math.max(0, newBalance), patient_id, month, year]);
    } else {
      // Get patient details for new record
      const [patient] = await connection.execute(`
        SELECT bloodTest + fees + pickupCharge as total_fees 
        FROM patients WHERE id = ?
      `, [patient_id]);
      
      const totalFees = patient[0]?.total_fees || 0;
      const balance = totalFees - parseFloat(payment_amount);
      
      // Create new record
      await connection.execute(`
        INSERT INTO patient_payment_records 
        (patient_id, month, year, total_fees, total_paid, balance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        patient_id,
        month,
        year,
        totalFees,
        payment_amount,
        Math.max(0, balance)
      ]);
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: paymentResult.insertId
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

module.exports = router;
