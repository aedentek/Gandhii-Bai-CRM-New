import express from 'express';
import db from '../db/config.js';

const router = express.Router();

console.log('💰 Doctor Salary routes module loaded!');

// Get all doctors with salary information
router.get('/doctor-salaries', async (req, res) => {
  try {
    console.log('📋 Getting all doctors with salary information...');
    
    // Get current month and year for advance calculation
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();
    
    // Get doctors with total paid from doctor_salary_settlements and advance data
    const query = `
      SELECT 
        d.id,
        d.name,
        d.email,
        d.phone,
        d.specialization,
        d.salary,
        COALESCE(
          (SELECT SUM(amount) 
           FROM doctor_salary_settlements 
           WHERE doctor_id = d.id
          ), 0) as total_paid,
        COALESCE(
          (SELECT SUM(amount) 
           FROM doctor_advance 
           WHERE doctor_id = d.id 
           AND MONTH(date) = ? 
           AND YEAR(date) = ?
          ), 0) as advance_amount,
        COALESCE(
          (SELECT carry_forward_from_previous 
           FROM doctor_monthly_salary 
           WHERE doctor_id = d.id 
           AND month = ? 
           AND year = ?
           ORDER BY id DESC 
           LIMIT 1
          ), 0) as carry_forward,
        d.payment_mode,
        d.status,
        d.photo,
        d.join_date
      FROM doctors d
      WHERE d.status = 'Active'
      ORDER BY d.name ASC
    `;
    
    const [rows] = await db.execute(query, [
      currentMonth, currentYear,  // for current month advance
      currentMonth, currentYear   // for carry forward from current month's record
    ]);
    
    console.log(`✅ Found ${rows.length} doctors with salary info`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctor salaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor salaries',
      error: error.message
    });
  }
});

// Get doctor salary by doctor ID
router.get('/doctor-salaries/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log(`📋 Getting salary info for doctor: ${doctorId}`);
    
    const query = `
      SELECT 
        d.*,
        COALESCE(
          (SELECT SUM(amount) 
           FROM doctor_salary_settlements 
           WHERE doctor_id = d.id
          ), 0) as total_paid,
        MONTH(CURDATE()) as month,
        YEAR(CURDATE()) as year,
        'Bank Transfer' as payment_mode,
        'Active' as status,
        NOW() as last_payment_date
      FROM doctors d
      WHERE d.id = ?
    `;
    
    const [rows] = await db.execute(query, [doctorId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    console.log(`✅ Found salary info for doctor: ${rows[0].name}`);
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctor salary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor salary',
      error: error.message
    });
  }
});

// Get salary history for a doctor
router.get('/doctor-salaries/:doctorId/history', async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log(`📋 Getting salary history for doctor: ${doctorId}`);
    
    const query = `
      SELECT 
        dss.id,
        dss.doctor_id,
        dss.doctor_name,
        dss.amount as payment_amount,
        dss.type,
        dss.payment_date,
        dss.payment_mode,
        dss.comment as notes,
        dss.created_at,
        d.photo as doctor_photo
      FROM doctor_salary_settlements dss
      LEFT JOIN doctors d ON dss.doctor_id = d.id
      WHERE dss.doctor_id = ?
      ORDER BY dss.payment_date DESC, dss.created_at DESC
    `;
    
    const [rows] = await db.execute(query, [doctorId]);
    
    console.log(`✅ Found ${rows.length} salary settlement records`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching salary history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary history',
      error: error.message
    });
  }
});

// Process salary payment - Save directly to doctor_salary_settlements
router.post('/doctor-salaries/payment', async (req, res) => {
  try {
    const {
      doctorId,
      paymentAmount,
      paymentDate,
      paymentMode,
      notes
    } = req.body;

    console.log(`💰 Recording salary payment for doctor: ${doctorId}`);
    console.log('Payment details:', { paymentAmount, paymentDate, paymentMode });

    // First get doctor's name
    const [doctorRows] = await db.execute('SELECT name FROM doctors WHERE id = ?', [doctorId]);
    
    if (doctorRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    const doctorName = doctorRows[0].name;

    // Try to insert with doctor_name, if it fails, insert without it
    let insertQuery, values;
    
    try {
      // First try with doctor_name column
      insertQuery = `
        INSERT INTO doctor_salary_settlements (
          doctor_id, doctor_name, amount, type, payment_date, payment_mode, comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      values = [
        doctorId, 
        doctorName,
        paymentAmount, 
        'salary',  // Default type 
        paymentDate, 
        paymentMode, 
        notes || ''
      ];
      
      const [result] = await db.execute(insertQuery, values);
      
      console.log('✅ Salary payment recorded successfully with doctor name, ID:', result.insertId);
      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          id: result.insertId,
          doctorId: doctorId,
          doctorName: doctorName,
          amount: paymentAmount,
          type: 'salary',
          paymentDate: paymentDate,
          paymentMode: paymentMode
        }
      });
      
    } catch (columnError) {
      if (columnError.code === 'ER_BAD_FIELD_ERROR' && columnError.message.includes('doctor_name')) {
        // doctor_name column doesn't exist, insert without it
        console.log('⚠️  doctor_name column not found, inserting without it...');
        
        insertQuery = `
          INSERT INTO doctor_salary_settlements (
            doctor_id, amount, type, payment_date, payment_mode, comment
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        values = [
          doctorId, 
          paymentAmount, 
          'salary',  // Default type 
          paymentDate, 
          paymentMode, 
          notes || ''
        ];
        
        const [result] = await db.execute(insertQuery, values);
        
        console.log('✅ Salary payment recorded successfully without doctor name, ID:', result.insertId);
        res.json({
          success: true,
          message: 'Payment recorded successfully',
          data: {
            id: result.insertId,
            doctorId: doctorId,
            doctorName: doctorName, // Still return it from doctors table
            amount: paymentAmount,
            type: 'salary',
            paymentDate: paymentDate,
            paymentMode: paymentMode
          }
        });
      } else {
        throw columnError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

// Update salary payment
router.put('/doctor-salaries/payment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentAmount,
      paymentDate,
      paymentMode,
      notes
    } = req.body;

    console.log(`📝 Updating salary payment with ID: ${id}`);

    const query = `
      UPDATE doctor_salary_history 
      SET payment_amount = ?, payment_date = ?, payment_mode = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [result] = await db.execute(query, [paymentAmount, paymentDate, paymentMode, notes, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    console.log('✅ Salary payment updated successfully');
    res.json({
      success: true,
      message: 'Payment updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
});

// Delete salary payment
router.delete('/doctor-salaries/payment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting salary payment with ID: ${id}`);

    // Get payment details first from doctor_salary_settlements table
    const getPaymentQuery = `
      SELECT * FROM doctor_salary_settlements WHERE id = ?
    `;
    const [paymentRows] = await db.execute(getPaymentQuery, [id]);
    
    if (paymentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const payment = paymentRows[0];
    console.log(`📋 Found payment record: ₹${payment.amount} for doctor ${payment.doctor_id}`);

    // Delete payment record from doctor_salary_settlements table
    const deleteQuery = `
      DELETE FROM doctor_salary_settlements WHERE id = ?
    `;
    const [deleteResult] = await db.execute(deleteQuery, [id]);

    if (deleteResult.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete payment record'
      });
    }

    console.log(`✅ Salary payment deleted successfully from database, ID: ${id}`);
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

// Save monthly records and carry forward balances
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
    
    console.log(`💾 Saving monthly records for ${month}/${year} with automatic carry forward...`);
    
    await connection.beginTransaction();

    // First, let's get the previous month and year for carry forward
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }
    
    // Get all active doctors with their current salary data
    const doctorsQuery = `
      SELECT 
        d.id,
        d.name,
        d.salary,
        COALESCE(
          (SELECT SUM(amount) 
           FROM doctor_salary_settlements 
           WHERE doctor_id = d.id 
           AND MONTH(created_at) = ? 
           AND YEAR(created_at) = ?
          ), 0) as total_paid_this_month,
        COALESCE(
          (SELECT SUM(amount) 
           FROM doctor_advance 
           WHERE doctor_id = d.id 
           AND MONTH(date) = ? 
           AND YEAR(date) = ?
          ), 0) as advance_amount,
        COALESCE(
          (SELECT carry_forward_to_next 
           FROM doctor_monthly_salary 
           WHERE doctor_id = d.id 
           AND month = ? 
           AND year = ?
           LIMIT 1
          ), 0) as carry_forward_from_previous,
        d.join_date
      FROM doctors d
      WHERE d.status = 'Active'
      ORDER BY d.id ASC
    `;
    
    const [doctors] = await connection.execute(doctorsQuery, [
      month, year,  // for this month's payments
      month, year,  // for this month's advance
      prevMonth, prevYear  // for carry forward from previous month
    ]);

    let recordsProcessed = 0;
    let carryForwardUpdates = 0;
    
    for (const doctor of doctors) {
      // Calculate balance for this month
      const salary = parseFloat(doctor.salary) || 0;
      const totalPaid = parseFloat(doctor.total_paid_this_month) || 0;
      const advanceAmount = parseFloat(doctor.advance_amount) || 0;
      const carryForwardFromPrevious = parseFloat(doctor.carry_forward_from_previous) || 0;
      
      // Net Balance = Salary + Carry Forward From Previous - Total Paid - Advance
      const netBalance = salary + carryForwardFromPrevious - totalPaid - advanceAmount;
      
      // Carry forward to next month (only positive balances)
      const carryForwardToNext = netBalance > 0 ? netBalance : 0;
      
      // Check if record already exists for this doctor, month, year
      const [existingRecord] = await connection.execute(`
        SELECT id FROM doctor_monthly_salary 
        WHERE doctor_id = ? AND month = ? AND year = ?
      `, [doctor.id, month, year]);
      
      const recordData = [
        salary,  // base_salary
        totalPaid,  // total_paid
        advanceAmount,  // advance_amount
        carryForwardFromPrevious,  // carry_forward_from_previous
        carryForwardToNext,  // carry_forward_to_next
        netBalance,  // net_balance
        netBalance <= 0 ? 'Paid' : 'Pending',  // status
        doctor.id,
        month,
        year
      ];
      
      if (existingRecord.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE doctor_monthly_salary 
          SET 
            base_salary = ?,
            total_paid = ?,
            advance_amount = ?,
            carry_forward_from_previous = ?,
            carry_forward_to_next = ?,
            net_balance = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE doctor_id = ? AND month = ? AND year = ?
        `, recordData);
      } else {
        // Insert new record
        await connection.execute(`
          INSERT INTO doctor_monthly_salary (
            doctor_id, month, year, base_salary, total_paid, advance_amount,
            carry_forward_from_previous, carry_forward_to_next, net_balance, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, recordData);
      }
      
      // Log carry forward information
      if (carryForwardToNext > 0) {
        console.log(`📋 Doctor ${doctor.name}: Balance ₹${netBalance.toFixed(2)} will carry forward to next month`);
        carryForwardUpdates++;
      }
      
      recordsProcessed++;
    }
    
    await connection.commit();
    
    console.log(`✅ Successfully processed ${recordsProcessed} monthly records for ${month}/${year}`);
    console.log(`💰 ${carryForwardUpdates} doctors have balances carrying forward to next month`);
    
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
    console.error('❌ Error saving monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly records',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get carry forward information for next month
router.get('/carry-forward/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    console.log(`📋 Getting carry forward info for ${month}/${year}`);
    
    const query = `
      SELECT 
        d.id,
        d.name,
        dms.carry_forward_to_next as carry_forward_amount,
        dms.net_balance,
        dms.status as monthly_status
      FROM doctors d
      LEFT JOIN doctor_monthly_salary dms ON d.id = dms.doctor_id 
        AND dms.month = ? AND dms.year = ?
      WHERE d.status = 'Active' AND dms.carry_forward_to_next > 0
      ORDER BY d.name ASC
    `;
    
    const [rows] = await db.execute(query, [month, year]);
    
    console.log(`✅ Found ${rows.length} doctors with carry forward amounts`);
    res.json({
      success: true,
      data: rows,
      totalCarryForward: rows.reduce((sum, doctor) => sum + parseFloat(doctor.carry_forward_amount || 0), 0)
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

// Process automatic carry forward to next month
router.post('/process-carry-forward', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { fromMonth, fromYear, toMonth, toYear } = req.body;
    
    if (!fromMonth || !fromYear || !toMonth || !toYear) {
      return res.status(400).json({
        success: false,
        message: 'All month and year parameters are required'
      });
    }
    
    console.log(`🔄 Processing carry forward from ${fromMonth}/${fromYear} to ${toMonth}/${toYear}`);
    
    await connection.beginTransaction();
    
    // Get all doctors with positive carry forward amounts
    const [carryForwardDoctors] = await connection.execute(`
      SELECT 
        doctor_id,
        carry_forward_to_next
      FROM doctor_monthly_salary 
      WHERE month = ? AND year = ? AND carry_forward_to_next > 0
    `, [fromMonth, fromYear]);
    
    let processed = 0;
    
    for (const doctor of carryForwardDoctors) {
      const carryForwardAmount = parseFloat(doctor.carry_forward_to_next);
      
      // Check if target month record already exists
      const [existingRecord] = await connection.execute(`
        SELECT id, carry_forward_from_previous 
        FROM doctor_monthly_salary 
        WHERE doctor_id = ? AND month = ? AND year = ?
      `, [doctor.doctor_id, toMonth, toYear]);
      
      if (existingRecord.length > 0) {
        // Update existing record with carry forward
        await connection.execute(`
          UPDATE doctor_monthly_salary 
          SET carry_forward_from_previous = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE doctor_id = ? AND month = ? AND year = ?
        `, [carryForwardAmount, doctor.doctor_id, toMonth, toYear]);
      } else {
        // Create new record for next month with carry forward
        const [doctorInfo] = await connection.execute(`
          SELECT name, salary FROM doctors WHERE id = ?
        `, [doctor.doctor_id]);
        
        if (doctorInfo.length > 0) {
          await connection.execute(`
            INSERT INTO doctor_monthly_salary (
              doctor_id, month, year, base_salary, carry_forward_from_previous, 
              net_balance, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            doctor.doctor_id,
            toMonth,
            toYear,
            doctorInfo[0].salary,
            carryForwardAmount,
            parseFloat(doctorInfo[0].salary) + carryForwardAmount, // Base salary + carry forward
            'Pending'
          ]);
        }
      }
      
      processed++;
    }
    
    await connection.commit();
    
    console.log(`✅ Processed carry forward for ${processed} doctors`);
    
    res.json({
      success: true,
      message: `Carry forward processed successfully for ${processed} doctors`,
      processedCount: processed,
      fromPeriod: `${fromMonth}/${fromYear}`,
      toPeriod: `${toMonth}/${toYear}`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error processing carry forward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process carry forward',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

export default router;
