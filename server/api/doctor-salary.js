import express from 'express';
import db from '../db/config.js';
// import DoctorSalaryAutoSave from '../services/doctorSalaryAutoSave.js';

const router = express.Router();

console.log('💰 Doctor Salary routes module loaded!');

// Get all doctors with salary information
router.get('/doctor-salaries', async (req, res) => {
  try {
    console.log('📋 Getting all doctors with salary information...');
    
    // Get month and year from query params or use current date
    const queryMonth = req.query.month ? parseInt(req.query.month) : null;
    const queryYear = req.query.year ? parseInt(req.query.year) : null;
    
    const currentDate = new Date();
    const targetMonth = queryMonth || (currentDate.getMonth() + 1);
    const targetYear = queryYear || currentDate.getFullYear();
    
    // Calculate previous month for carry forward
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }
    
    console.log('📅 Target Month/Year for calculations:', { targetMonth, targetYear, fromQuery: !!queryMonth });
    console.log('📅 Previous Month/Year for carry forward:', { prevMonth, prevYear });
    
    // First, check if there's any data for the selected month in doctor_monthly_salary
    try {
      const [monthlyData] = await db.execute(
        'SELECT COUNT(*) as count FROM doctor_monthly_salary WHERE month = ? AND year = ?',
        [targetMonth, targetYear]
      );
      
      const hasMonthlyData = monthlyData[0].count > 0;
      console.log(`📅 Monthly data check for ${targetMonth}/${targetYear}: ${hasMonthlyData ? 'Found' : 'Not found'}`);
      
      if (hasMonthlyData) {
        // Use doctor_monthly_salary data for the specific month
        const monthlyQuery = `
          SELECT 
            d.id,
            d.name,
            d.email,
            d.phone,
            d.specialization,
            COALESCE(dms.base_salary, d.salary, 0) as salary,
            COALESCE(dms.paid_amount, 0) as monthly_paid,
            COALESCE(
              (SELECT SUM(amount) 
               FROM doctor_salary_settlements 
               WHERE doctor_id = d.id 
               AND MONTH(payment_date) = ? 
               AND YEAR(payment_date) = ?
              ), 0) as total_paid,
            COALESCE(dms.advance_amount, 0) as advance_amount,
            COALESCE(
              (SELECT carry_forward_to_next 
               FROM doctor_monthly_salary 
               WHERE doctor_id = d.id 
               AND month = ? AND year = ?
               LIMIT 1
              ), 0) as carry_forward,
            COALESCE(dms.net_balance, 
              (COALESCE(dms.base_salary, d.salary, 0) + 
                COALESCE(
                  (SELECT carry_forward_to_next 
                   FROM doctor_monthly_salary 
                   WHERE doctor_id = d.id 
                   AND month = ? AND year = ?
                   LIMIT 1
                  ), 0)
              ) - 
              (COALESCE(dms.paid_amount, 0) + COALESCE(dms.advance_amount, 0))
            ) as balance,
            d.payment_mode,
            CASE 
              WHEN dms.net_balance > 0 THEN 'Pending'
              WHEN dms.net_balance = 0 THEN 'Paid'
              ELSE 'Overpaid'
            END as status,
            d.photo,
            d.join_date
          FROM doctors d
          LEFT JOIN doctor_monthly_salary dms ON d.id = dms.doctor_id 
            AND dms.month = ? AND dms.year = ?
          WHERE d.status = 'Active' AND dms.id IS NOT NULL
          ORDER BY d.name ASC
        `;
        
        const [monthlyRows] = await db.execute(monthlyQuery, [
          targetMonth, targetYear,  // for total_paid calculation
          prevMonth, prevYear,      // for carry_forward calculation
          prevMonth, prevYear,      // for balance carry_forward calculation  
          targetMonth, targetYear   // for the main JOIN
        ]);
        
        console.log(`✅ Found ${monthlyRows.length} doctors with monthly salary data`);
        
        // Debug carry forward values
        monthlyRows.forEach(doctor => {
          if (doctor.carry_forward > 0) {
            console.log(`💰 ${doctor.name} (${doctor.id}): Carry forward from ${prevMonth}/${prevYear} = ₹${doctor.carry_forward}`);
          }
        });
        
        res.json({
          success: true,
          data: monthlyRows
        });
        
      } else {
        // Fallback to doctors table when no monthly data exists
        console.log('⚠️ No monthly salary data found, falling back to doctors table with month-specific advances');
        
        // First check if doctor_advance table exists
        const [advanceTableCheck] = await db.execute('SHOW TABLES LIKE "doctor_advance"');
        const advanceTableExists = advanceTableCheck.length > 0;
        
        let fallbackQuery;
        let queryParams = [];
        
        if (advanceTableExists) {
          // Include month-specific advances from doctor_advance table and actual payments
          fallbackQuery = `
            SELECT 
              d.id,
              d.name,
              d.email,
              d.phone,
              d.specialization,
              COALESCE(d.salary, 0) as salary,
              0 as monthly_paid,
              COALESCE(
                (SELECT SUM(amount) 
                 FROM doctor_salary_settlements 
                 WHERE doctor_id = d.id 
                 AND MONTH(payment_date) = ? 
                 AND YEAR(payment_date) = ?
                ), 0) as total_paid,
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
                 AND month = ? AND year = ?
                 LIMIT 1
                ), 0) as carry_forward,
              (COALESCE(d.salary, 0) + 
                COALESCE(
                  (SELECT carry_forward_to_next 
                   FROM doctor_monthly_salary 
                   WHERE doctor_id = d.id 
                   AND month = ? AND year = ?
                   LIMIT 1
                  ), 0) - 
                COALESCE(
                  (SELECT SUM(amount) 
                   FROM doctor_salary_settlements 
                   WHERE doctor_id = d.id 
                   AND MONTH(payment_date) = ? 
                   AND YEAR(payment_date) = ?
                  ), 0) -
                COALESCE(
                  (SELECT SUM(amount) 
                   FROM doctor_advance 
                   WHERE doctor_id = d.id 
                   AND MONTH(date) = ? 
                   AND YEAR(date) = ?
                  ), 0)
              ) as balance,
              d.payment_mode,
              d.status,
              d.photo,
              d.join_date
            FROM doctors d
            WHERE d.status = 'Active'
            AND (
              d.join_date IS NULL 
              OR d.join_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
            )
            ORDER BY d.name ASC
          `;
          queryParams = [
            targetMonth, targetYear,  // for this month's payments
            targetMonth, targetYear,  // for this month's advances
            prevMonth, prevYear,      // for carry_forward calculation
            prevMonth, prevYear,      // for balance carry_forward calculation
            targetMonth, targetYear,  // for balance payments calculation
            targetMonth, targetYear,  // for balance advances calculation
            targetYear, targetMonth   // for join date filtering
          ];
        } else {
          // No advance table, use basic query with actual payments
          fallbackQuery = `
            SELECT 
              d.id,
              d.name,
              d.email,
              d.phone,
              d.specialization,
              COALESCE(d.salary, 0) as salary,
              0 as monthly_paid,
              COALESCE(
                (SELECT SUM(amount) 
                 FROM doctor_salary_settlements 
                 WHERE doctor_id = d.id 
                 AND MONTH(payment_date) = ? 
                 AND YEAR(payment_date) = ?
                ), 0) as total_paid,
              0 as advance_amount,
              COALESCE(
                (SELECT carry_forward_to_next 
                 FROM doctor_monthly_salary 
                 WHERE doctor_id = d.id 
                 AND month = ? AND year = ?
                 LIMIT 1
                ), 0) as carry_forward,
              (COALESCE(d.salary, 0) + 
                COALESCE(
                  (SELECT carry_forward_to_next 
                   FROM doctor_monthly_salary 
                   WHERE doctor_id = d.id 
                   AND month = ? AND year = ?
                   LIMIT 1
                  ), 0) - 
                COALESCE(
                  (SELECT SUM(amount) 
                   FROM doctor_salary_settlements 
                   WHERE doctor_id = d.id 
                   AND MONTH(payment_date) = ? 
                   AND YEAR(payment_date) = ?
                  ), 0)
              ) as balance,
              d.payment_mode,
              d.status,
              d.photo,
              d.join_date
            FROM doctors d
            WHERE d.status = 'Active'
            AND (
              d.join_date IS NULL 
              OR d.join_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
            )
            ORDER BY d.name ASC
          `;
          queryParams = [
            targetMonth, targetYear,  // for this month's payments
            prevMonth, prevYear,      // for carry_forward calculation
            prevMonth, prevYear,      // for balance carry_forward calculation
            targetMonth, targetYear,  // for balance payments calculation
            targetYear, targetMonth   // for join date filtering
          ];
        }
        
        const [doctorRows] = await db.execute(fallbackQuery, queryParams);
        console.log(`✅ Fallback successful: Found ${doctorRows.length} doctors from doctors table with ${advanceTableExists ? 'month-specific' : 'no'} advances`);
        
        // Debug carry forward values for fallback
        doctorRows.forEach(doctor => {
          if (doctor.carry_forward > 0) {
            console.log(`💰 ${doctor.name} (${doctor.id}): Carry forward from ${prevMonth}/${prevYear} = ₹${doctor.carry_forward} (FALLBACK)`);
          }
        });
        
        res.json({
          success: true,
          data: doctorRows,
          fallback: true,
          message: `No salary data found for ${targetMonth}/${targetYear}. Showing basic doctor information with month-specific advances.`
        });
      }
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Ultimate fallback - try to get just basic doctor data if there are any DB issues
      try {
        const fallbackQuery = `
          SELECT 
            id,
            name,
            email,
            phone,
            specialization,
            COALESCE(salary, 0) as salary,
            0 as monthly_paid,
            0 as total_paid,
            0 as advance_amount,
            0 as carry_forward,
            COALESCE(salary, 0) as balance,
            payment_mode,
            status,
            photo,
            join_date
          FROM doctors
          WHERE status = 'Active'
          ORDER BY name ASC
        `;
        
        const [rows] = await db.execute(fallbackQuery);
        
        console.log(`✅ Ultimate fallback successful: Found ${rows.length} doctors`);
        res.json({
          success: true,
          data: rows,
          fallback: true,
          message: 'Database error occurred. Showing basic doctor information.'
        });
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    
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
    console.log(`🗓️ Applying join date filter: only doctors who joined before or during ${month}/${year}`);
    
    await connection.beginTransaction();

    // First, let's get the previous month and year for carry forward
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }
    
    // Get all active doctors with their current salary data
    // Apply same filtering logic as the display: only doctors who joined before or during selected month
    const doctorsQuery = `
      SELECT 
        d.id,
        d.name,
        d.salary,
        d.join_date,
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
      AND (
        d.join_date IS NULL 
        OR d.join_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
      )
      ORDER BY d.id ASC
    `;

    const [doctors] = await connection.execute(doctorsQuery, [
      month, year,  // for this month's payments
      month, year,  // for this month's advance
      prevMonth, prevYear,  // for carry forward from previous month
      year, month   // for join date filtering
    ]);

    console.log(`👨‍⚕️ Found ${doctors.length} eligible doctors for ${month}/${year} (after join date filtering):`);
    doctors.forEach(doctor => {
      console.log(`  - ${doctor.name} (${doctor.id}): joined ${doctor.join_date || 'N/A'}`);
    });    let recordsProcessed = 0;
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

// Alias route for frontend compatibility - same as save-monthly-records above
router.post('/doctor-salaries/save-monthly-records', async (req, res) => {
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
    console.log(`🗓️ Applying join date filter: only doctors who joined before or during ${month}/${year}`);
    
    await connection.beginTransaction();

    // First, let's get the previous month and year for carry forward
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }
    
    // Get all active doctors with their current salary data
    // Apply same filtering logic as the display: only doctors who joined before or during selected month
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
      AND (
        d.join_date IS NULL 
        OR d.join_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
      )
      ORDER BY d.id ASC
    `;
    
    const [doctors] = await connection.execute(doctorsQuery, [
      month, year,  // for this month's payments
      month, year,  // for this month's advance
      prevMonth, prevYear,  // for carry forward from previous month
      year, month   // for join date filtering
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
        totalPaid,  // paid_amount
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
          SET base_salary = ?, paid_amount = ?, advance_amount = ?, 
              carry_forward_from_previous = ?, carry_forward_to_next = ?, 
              net_balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE doctor_id = ? AND month = ? AND year = ?
        `, recordData);
        
        console.log(`📝 Updated record for ${doctor.name}: Balance = ₹${netBalance}`);
      } else {
        // Insert new record
        await connection.execute(`
          INSERT INTO doctor_monthly_salary 
          (doctor_id, month, year, base_salary, paid_amount, advance_amount, 
           carry_forward_from_previous, carry_forward_to_next, net_balance, 
           status, auto_created, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [doctor.id, month, year, ...recordData.slice(0, 7)]);
        
        console.log(`✅ Created record for ${doctor.name}: Balance = ₹${netBalance}`);
      }
      
      if (carryForwardToNext > 0) {
        carryForwardUpdates++;
      }
      
      recordsProcessed++;
    }
    
    await connection.commit();
    console.log(`✅ Monthly records saved successfully for ${month}/${year}`);
    
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

// Manual Save Monthly Salaries endpoint
router.post('/doctor-salaries/save-monthly', async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    console.log(`📅 Manual save request for ${month}/${year}`);
    
    // Get all active doctors with their current data
    const [doctors] = await db.execute(`
      SELECT 
        d.id as doctor_id,
        d.name,
        d.salary as base_salary,
        COALESCE(
          (SELECT SUM(amount) 
           FROM doctor_advance 
           WHERE doctor_id = d.id 
           AND MONTH(date) = ? 
           AND YEAR(date) = ?
          ), 0) as advance_amount,
        COALESCE(
          (SELECT SUM(amount) 
           FROM doctor_salary_settlements 
           WHERE doctor_id = d.id
           AND MONTH(payment_date) = ?
           AND YEAR(payment_date) = ?
          ), 0) as paid_amount,
        -- Carry forward from previous month (if exists)
        COALESCE(
          (SELECT net_balance 
           FROM doctor_monthly_salary 
           WHERE doctor_id = d.id 
           AND ((month = ? - 1 AND year = ?) OR (month = 12 AND year = ? - 1 AND ? = 1))
           ORDER BY id DESC 
           LIMIT 1
          ), 0) as carry_forward_from_previous
      FROM doctors d
      WHERE d.status = 'Active'
      ORDER BY d.id ASC
    `, [month, year, month, year, month, year, year, month]);
    
    console.log(`📋 Found ${doctors.length} active doctors to save for ${month}/${year}`);
    
    if (doctors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active doctors found'
      });
    }
    
    let savedCount = 0;
    
    for (const doctor of doctors) {
      // Check if record already exists
      const [existing] = await db.execute(`
        SELECT id FROM doctor_monthly_salary 
        WHERE doctor_id = ? AND month = ? AND year = ?
      `, [doctor.doctor_id, month, year]);
      
      const totalOwed = parseFloat(doctor.base_salary) + parseFloat(doctor.carry_forward_from_previous);
      const totalPaid = parseFloat(doctor.paid_amount) + parseFloat(doctor.advance_amount);
      const netBalance = totalOwed - totalPaid;
      const carryForwardToNext = netBalance > 0 ? netBalance : 0;
      
      if (existing.length > 0) {
        // Update existing record
        await db.execute(`
          UPDATE doctor_monthly_salary 
          SET 
            base_salary = ?,
            advance_amount = ?,
            paid_amount = ?,
            carry_forward_from_previous = ?,
            carry_forward_to_next = ?,
            net_balance = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE doctor_id = ? AND month = ? AND year = ?
        `, [
          doctor.base_salary,
          doctor.advance_amount,
          doctor.paid_amount,
          doctor.carry_forward_from_previous,
          carryForwardToNext,
          netBalance,
          netBalance === 0 ? 'Paid' : 'Pending',
          doctor.doctor_id,
          month,
          year
        ]);
        
        console.log(`📝 Updated monthly record for ${doctor.name} (${doctor.doctor_id})`);
      } else {
        // Insert new record
        await db.execute(`
          INSERT INTO doctor_monthly_salary (
            doctor_id, month, year, base_salary, advance_amount, paid_amount,
            carry_forward_from_previous, carry_forward_to_next, net_balance, status,
            auto_created, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          doctor.doctor_id,
          month,
          year,
          doctor.base_salary,
          doctor.advance_amount,
          doctor.paid_amount,
          doctor.carry_forward_from_previous,
          carryForwardToNext,
          netBalance,
          netBalance === 0 ? 'Paid' : 'Pending'
        ]);
        
        console.log(`✅ Created monthly record for ${doctor.name} (${doctor.doctor_id}): Balance = ₹${netBalance}`);
      }
      
      savedCount++;
    }
    
    const result = {
      success: true,
      message: `Successfully saved monthly records for ${savedCount} doctors for ${month}/${year}`,
      data: {
        month,
        year,
        doctorCount: savedCount
      }
    };
    
    console.log(`✅ Manual save completed: ${result.message}`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error in manual save:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly doctor salaries',
      error: error.message
    });
  }
});

// Test endpoint to create sample data for DOC001
router.post('/doctor-salaries/create-test-data', async (req, res) => {
  try {
    console.log('🧪 Creating test salary data for DOC001...');
    
    // Get DOC001 doctor ID
    const [doctors] = await db.execute('SELECT id FROM doctors WHERE doctor_id = "DOC001"');
    
    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'DOC001 doctor not found'
      });
    }
    
    const doctorId = doctors[0].id;
    
    // Clear existing records
    await db.execute('DELETE FROM doctor_monthly_salary WHERE doctor_id = ?', [doctorId]);
    
    // Create test records
    const records = [
      [doctorId, 1, 2025, 13000.00, 0.00, 2000.00, 1],
      [doctorId, 2, 2025, 16500.00, 2000.00, 1500.00, 1],
      [doctorId, 3, 2025, 15500.00, 1500.00, 1000.00, 1],
      [doctorId, 4, 2025, 16000.00, 1000.00, 0.00, 1],
      [doctorId, 5, 2025, 15000.00, 0.00, 500.00, 1],
      [doctorId, 6, 2025, 15500.00, 500.00, 0.00, 1],
      [doctorId, 7, 2025, 15000.00, 0.00, 800.00, 1],
      [doctorId, 8, 2025, 14200.00, 800.00, 0.00, 1]
    ];
    
    const insertQuery = `
      INSERT INTO doctor_monthly_salary 
      (doctor_id, month, year, total_paid, carry_forward_from_previous, carry_forward_to_next, auto_created, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    let createdCount = 0;
    for (const record of records) {
      const result = await db.execute(insertQuery, record);
      createdCount++;
    }
    
    console.log(`✅ Created ${createdCount} test salary records for DOC001`);
    
    res.json({
      success: true,
      message: `Created ${createdCount} monthly salary records for DOC001`,
      records: createdCount
    });
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test data',
      error: error.message
    });
  }
});

export default router;
