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
    
    // Get patient payment records for the specified month/year
    const [payments] = await pool.execute(`
      SELECT 
        ppr.*,
        p.name as patient_name
      FROM patient_payment_records ppr
      LEFT JOIN patients p ON p.id = ppr.patient_id
      WHERE ppr.month = ? AND ppr.year = ?
      ORDER BY ppr.created_at DESC
      LIMIT ? OFFSET ?
    `, [targetMonth, targetYear, parseInt(limit), offset]);

    // Get total count for pagination
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM patient_payment_records ppr
      WHERE ppr.month = ? AND ppr.year = ?
    `, [targetMonth, targetYear]);

    // Get stats for the month
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(*) as totalPatients,
        COALESCE(SUM(test_report_amount), 0) as totalTestReportAmount,
        COALESCE(SUM(amount_paid), 0) as totalPaid,
        COALESCE(SUM(amount_pending), 0) as totalPending
      FROM patient_payment_records ppr
      WHERE ppr.month = ? AND ppr.year = ?
    `, [targetMonth, targetYear]);

    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));
    const stats = statsResult[0] || {
      totalPatients: 0,
      totalTestReportAmount: 0,
      totalPaid: 0,
      totalPending: 0
    };

    res.json({
      success: true,
      payments,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        limit: parseInt(limit)
      }
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

export default router;
