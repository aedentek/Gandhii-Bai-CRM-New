import express from 'express';
import db from '../db/config.js';

const router = express.Router();

console.log('💰 Staff Salary routes module loaded!');

// Get all staff for salary management (with salary data for current month)
router.get('/staff-salaries', async (req, res) => {
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

    console.log(`📋 Getting staff salary data for ${targetMonth}/${targetYear}`);

    // Check if staff_advance table exists
    const [advanceTableCheck] = await db.execute("SHOW TABLES LIKE 'staff_advance'");
    const advanceTableExists = advanceTableCheck.length > 0;
    console.log(`🔍 Staff advance table exists: ${advanceTableExists}`);

    let query;
    let queryParams = [];

    if (advanceTableExists) {
      // Enhanced query with staff_advance integration and monthly salary tracking
      query = `
        SELECT 
          s.id,
          s.name,
          s.email,
          s.phone,
          s.role,
          s.department,
          COALESCE(sms.base_salary, s.salary, 0) as salary,
          COALESCE(sms.total_paid, 0) as monthly_paid,
          COALESCE(
            (SELECT SUM(payment_amount) 
             FROM staff_salary_settlements 
             WHERE staff_id = s.id 
             AND MONTH(payment_date) = ? 
             AND YEAR(payment_date) = ?
            ), 0) as total_paid,
          COALESCE(
            (SELECT SUM(amount) 
             FROM staff_advance 
             WHERE staff_id = s.id 
             AND MONTH(date) = ? 
             AND YEAR(date) = ?
            ), 0) as advance_amount,
          COALESCE(
            (SELECT carry_forward_to_next 
             FROM staff_monthly_salary 
             WHERE staff_id = s.id 
             AND month = ? AND year = ?
             LIMIT 1
            ), 0) as carry_forward,
          COALESCE(sms.net_balance, 
            (COALESCE(sms.base_salary, s.salary, 0) + 
              COALESCE(
                (SELECT carry_forward_to_next 
                 FROM staff_monthly_salary 
                 WHERE staff_id = s.id 
                 AND month = ? AND year = ?
                 LIMIT 1
                ), 0) - 
              COALESCE(
                (SELECT SUM(payment_amount) 
                 FROM staff_salary_settlements 
                 WHERE staff_id = s.id 
                 AND MONTH(payment_date) = ? 
                 AND YEAR(payment_date) = ?
                ), 0) -
              COALESCE(
                (SELECT SUM(amount) 
                 FROM staff_advance 
                 WHERE staff_id = s.id 
                 AND MONTH(date) = ? 
                 AND YEAR(date) = ?
                ), 0)
            )) as balance,
          s.status as payment_mode,
          CASE 
            WHEN sms.net_balance > 0 THEN 'Pending'
            WHEN sms.net_balance = 0 THEN 'Paid'
            ELSE 'Overpaid'
          END as status,
          s.photo,
          s.join_date
        FROM staff s
        LEFT JOIN staff_monthly_salary sms ON s.id = sms.staff_id 
          AND sms.month = ? AND sms.year = ?
        WHERE s.status = 'Active' 
          AND (
            s.join_date IS NULL 
            OR s.join_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
          )
        ORDER BY s.name ASC
      `;
      queryParams = [
        targetMonth, targetYear,  // for this month's payments
        targetMonth, targetYear,  // for this month's advances
        prevMonth, prevYear,      // for carry_forward calculation
        prevMonth, prevYear,      // for balance carry_forward calculation
        targetMonth, targetYear,  // for balance payments calculation
        targetMonth, targetYear,  // for balance advances calculation
        targetMonth, targetYear,  // for staff_monthly_salary join
        targetYear, targetMonth   // for join date filtering
      ];
    } else {
      // Fallback query without advance table
      query = `
        SELECT 
          s.id,
          s.name,
          s.email,
          s.phone,
          s.role,
          s.department,
          COALESCE(s.salary, 0) as salary,
          0 as monthly_paid,
          COALESCE(
            (SELECT SUM(payment_amount) 
             FROM staff_salary_settlements 
             WHERE staff_id = s.id 
             AND MONTH(payment_date) = ? 
             AND YEAR(payment_date) = ?
            ), 0) as total_paid,
          0 as advance_amount,
          COALESCE(
            (SELECT carry_forward_to_next 
             FROM staff_monthly_salary 
             WHERE staff_id = s.id 
             AND month = ? AND year = ?
             LIMIT 1
            ), 0) as carry_forward,
          (COALESCE(s.salary, 0) + 
            COALESCE(
              (SELECT carry_forward_to_next 
               FROM staff_monthly_salary 
               WHERE staff_id = s.id 
               AND month = ? AND year = ?
               LIMIT 1
              ), 0) - 
            COALESCE(
              (SELECT SUM(payment_amount) 
               FROM staff_salary_settlements 
               WHERE staff_id = s.id 
               AND MONTH(payment_date) = ? 
               AND YEAR(payment_date) = ?
              ), 0)
          ) as balance,
          s.status as payment_mode,
          CASE 
            WHEN (COALESCE(s.salary, 0) - COALESCE((SELECT SUM(payment_amount) FROM staff_salary_settlements WHERE staff_id = s.id AND MONTH(payment_date) = ? AND YEAR(payment_date) = ?), 0)) > 0 THEN 'Pending'
            WHEN (COALESCE(s.salary, 0) - COALESCE((SELECT SUM(payment_amount) FROM staff_salary_settlements WHERE staff_id = s.id AND MONTH(payment_date) = ? AND YEAR(payment_date) = ?), 0)) = 0 THEN 'Paid'
            ELSE 'Overpaid'
          END as status,
          s.photo,
          s.join_date
        FROM staff s
        WHERE s.status = 'Active'
          AND (
            s.join_date IS NULL 
            OR s.join_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
          )
        ORDER BY s.name ASC
      `;
      queryParams = [
        targetMonth, targetYear,  // for this month's payments
        prevMonth, prevYear,      // for carry_forward calculation
        prevMonth, prevYear,      // for balance carry_forward calculation
        targetMonth, targetYear,  // for balance payments calculation
        targetMonth, targetYear,  // for status calculation payments 1
        targetMonth, targetYear,  // for status calculation payments 2
        targetYear, targetMonth   // for join date filtering
      ];
    }

    const [rows] = await db.execute(query, queryParams);
    
    console.log(`✅ Found ${rows.length} staff members for salary management`);
    
    // Calculate summary statistics
    const totalStaff = rows.length;
    const totalSalary = rows.reduce((sum, staff) => sum + (parseFloat(staff.salary) || 0), 0);
    const totalPaid = rows.reduce((sum, staff) => sum + (parseFloat(staff.total_paid) || 0), 0);
    const totalPending = totalSalary - totalPaid;
    
    res.json({
      success: true,
      data: rows,
      summary: {
        total_staff: totalStaff,
        total_salary: totalSalary,
        total_paid: totalPaid,
        total_pending: totalPending,
        month: targetMonth,
        year: targetYear
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching staff salaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff salaries',
      error: error.message
    });
  }
});

// Record staff salary payment
router.post('/staff-salaries/payment', async (req, res) => {
  try {
    const {
      staffId,
      amount,
      date,
      type = 'salary',
      payment_mode = 'Bank Transfer',
      notes = ''
    } = req.body;

    console.log(`💳 Recording salary payment:`, {
      staffId,
      amount,
      date,
      type,
      payment_mode
    });

    // Validate required fields
    if (!staffId || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staffId, amount, date'
      });
    }

    // Get staff details
    const [staffRows] = await db.execute('SELECT * FROM staff WHERE id = ?', [staffId]);
    if (staffRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const staff = staffRows[0];
    const paymentDate = new Date(date);
    const month = paymentDate.getMonth() + 1;
    const year = paymentDate.getFullYear();

    // Insert payment record into staff_salary_settlements
    const insertQuery = `
      INSERT INTO staff_salary_settlements (
        staff_id, staff_name, payment_date, payment_amount, 
        payment_mode, type, month, year, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(insertQuery, [
      staffId,
      staff.name,
      date,
      amount,
      payment_mode,
      type,
      month,
      year,
      notes
    ]);

    // Also insert into staff_salary_history for detailed tracking
    const historyQuery = `
      INSERT INTO staff_salary_history (
        staff_id, staff_name, salary_month, salary_year,
        base_salary, payment_amount, payment_date, payment_mode,
        type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(historyQuery, [
      staffId,
      staff.name,
      month,
      year,
      staff.salary || 0,
      amount,
      date,
      payment_mode,
      type,
      notes
    ]);

    console.log(`✅ Salary payment recorded successfully, Payment ID: ${result.insertId}`);
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

// Get staff salary payment history
router.get('/staff-salaries/:staffId/history', async (req, res) => {
  try {
    const { staffId } = req.params;
    const { month, year } = req.query;

    console.log(`📋 Getting payment history for staff: ${staffId}`);

    let query = `
      SELECT 
        ssh.*,
        'settlement' as source
      FROM staff_salary_settlements ssh
      WHERE ssh.staff_id = ?
    `;
    
    let queryParams = [staffId];

    if (month && year) {
      query += ' AND ssh.month = ? AND ssh.year = ?';
      queryParams.push(parseInt(month), parseInt(year));
    }

    query += ' ORDER BY ssh.payment_date DESC, ssh.created_at DESC';

    const [rows] = await db.execute(query, queryParams);

    console.log(`✅ Found ${rows.length} payment records for staff ${staffId}`);
    res.json({
      success: true,
      data: rows
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

// Update salary payment
router.put('/staff-salaries/payment/:id', async (req, res) => {
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
      UPDATE staff_salary_settlements 
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
router.delete('/staff-salaries/payment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting salary payment with ID: ${id}`);

    // Get payment details before deletion for logging
    const [payment] = await db.execute('SELECT * FROM staff_salary_settlements WHERE id = ?', [id]);
    if (payment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    console.log(`📋 Found payment record: ₹${payment[0].payment_amount} for staff ${payment[0].staff_id}`);

    // Delete payment record from staff_salary_settlements table
    const deleteQuery = 'DELETE FROM staff_salary_settlements WHERE id = ?';
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
router.post('/staff-salaries/save-monthly-records/:month/:year', async (req, res) => {
  let connection;
  try {
    const { month, year } = req.params;
    console.log(`💾 Saving monthly records for ${month}/${year}...`);

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get all active staff with their salary data for the specified month/year
    const staffQuery = `
      SELECT 
        s.id,
        s.name,
        s.salary,
        COALESCE(
          (SELECT SUM(payment_amount) 
           FROM staff_salary_settlements 
           WHERE staff_id = s.id 
           AND month = ? AND year = ?
          ), 0) as total_paid_this_month,
        COALESCE(
          (SELECT SUM(amount) 
           FROM staff_advance 
           WHERE staff_id = s.id 
           AND MONTH(date) = ? 
           AND YEAR(date) = ?
          ), 0) as advance_amount,
        COALESCE(
          (SELECT carry_forward_to_next 
           FROM staff_monthly_salary 
           WHERE staff_id = s.id 
           AND month = ? AND year = ?
           LIMIT 1
          ), 0) as carry_forward_from_previous
      FROM staff s
      WHERE s.status = 'Active'
      ORDER BY s.id
    `;

    // Calculate previous month/year
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = parseInt(year) - 1;
    }

    const [staff] = await connection.execute(staffQuery, [
      month, year,           // for total_paid_this_month
      month, year,           // for advance_amount  
      prevMonth, prevYear    // for carry_forward_from_previous
    ]);

    console.log(`📊 Processing ${staff.length} staff members...`);

    for (const staffMember of staff) {
      // Calculate balance for this month
      const salary = parseFloat(staffMember.salary) || 0;
      const totalPaid = parseFloat(staffMember.total_paid_this_month) || 0;
      const advanceAmount = parseFloat(staffMember.advance_amount) || 0;
      const carryForwardFromPrevious = parseFloat(staffMember.carry_forward_from_previous) || 0;
      
      // Net Balance = Salary + Carry Forward From Previous - Total Paid - Advance
      const netBalance = salary + carryForwardFromPrevious - totalPaid - advanceAmount;
      
      // Carry forward to next month (only positive balances)
      const carryForwardToNext = netBalance > 0 ? netBalance : 0;
      
      // Check if record already exists for this staff, month, year
      const [existingRecord] = await connection.execute(`
        SELECT id FROM staff_monthly_salary 
        WHERE staff_id = ? AND month = ? AND year = ?
      `, [staffMember.id, month, year]);
      
      const recordData = [
        salary,  // base_salary
        totalPaid,  // total_paid
        advanceAmount,  // advance_amount
        carryForwardFromPrevious,  // carry_forward_from_previous
        carryForwardToNext,  // carry_forward_to_next
        netBalance,  // net_balance
        netBalance <= 0 ? 'Paid' : 'Pending',  // status
        staffMember.id,
        month,
        year
      ];
      
      if (existingRecord.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE staff_monthly_salary 
          SET 
            base_salary = ?,
            total_paid = ?,
            advance_amount = ?,
            carry_forward_from_previous = ?,
            carry_forward_to_next = ?,
            net_balance = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE staff_id = ? AND month = ? AND year = ?
        `, recordData);
      } else {
        // Insert new record
        await connection.execute(`
          INSERT INTO staff_monthly_salary (
            base_salary, total_paid, advance_amount,
            carry_forward_from_previous, carry_forward_to_next,
            net_balance, status, staff_id, month, year
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, recordData);
      }
      
      console.log(`📝 Processed ${staffMember.name}: Balance = ₹${netBalance}`);
    }

    await connection.commit();
    console.log('✅ Monthly records saved successfully');

    res.json({
      success: true,
      message: `Monthly records saved for ${month}/${year}`,
      processed: staff.length
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error saving monthly records:', error);
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

// Auto-run carry forward (similar to doctors)
router.post('/staff-salaries/auto-carry-forward/:month/:year', async (req, res) => {
  let connection;
  try {
    const { month, year } = req.params;
    console.log(`🔄 Auto-running carry forward for ${month}/${year}...`);

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Calculate previous month/year
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = parseInt(year) - 1;
    }

    // Get all active staff with their salary data including advances
    const staffQuery = `
      SELECT 
        s.id,
        s.name,
        s.salary,
        COALESCE(
          (SELECT SUM(payment_amount) 
           FROM staff_salary_settlements 
           WHERE staff_id = s.id 
           AND month = ? AND year = ?
          ), 0) as total_paid_this_month,
        COALESCE(
          (SELECT SUM(amount) 
           FROM staff_advance 
           WHERE staff_id = s.id 
           AND MONTH(date) = ? 
           AND YEAR(date) = ?
          ), 0) as advance_amount,
        COALESCE(
          (SELECT carry_forward_to_next 
           FROM staff_monthly_salary 
           WHERE staff_id = s.id 
           AND month = ? AND year = ?
           LIMIT 1
          ), 0) as carry_forward_from_previous
      FROM staff s
      WHERE s.status = 'Active'
      ORDER BY s.id
    `;

    const [staff] = await connection.execute(staffQuery, [
      month, year,           // for total_paid_this_month
      month, year,           // for advance_amount
      prevMonth, prevYear    // for carry_forward_from_previous
    ]);

    console.log(`📊 Auto-processing ${staff.length} staff members...`);

    for (const staffMember of staff) {
      // Calculate balance for this month
      const salary = parseFloat(staffMember.salary) || 0;
      const totalPaid = parseFloat(staffMember.total_paid_this_month) || 0;
      const advanceAmount = parseFloat(staffMember.advance_amount) || 0;
      const carryForwardFromPrevious = parseFloat(staffMember.carry_forward_from_previous) || 0;
      
      // Net Balance = Salary + Carry Forward From Previous - Total Paid - Advance
      const netBalance = salary + carryForwardFromPrevious - totalPaid - advanceAmount;
      
      // Carry forward to next month (only positive balances)
      const carryForwardToNext = netBalance > 0 ? netBalance : 0;
      
      // Check if record already exists for this staff, month, year
      const [existingRecord] = await connection.execute(`
        SELECT id FROM staff_monthly_salary 
        WHERE staff_id = ? AND month = ? AND year = ?
      `, [staffMember.id, month, year]);
      
      const recordData = [
        salary,  // base_salary
        totalPaid,  // paid_amount
        advanceAmount,  // advance_amount
        carryForwardFromPrevious,  // carry_forward_from_previous
        carryForwardToNext,  // carry_forward_to_next
        netBalance,  // net_balance
        netBalance <= 0 ? 'Paid' : 'Pending',  // status
        staffMember.id,
        month,
        year
      ];
      
      if (existingRecord.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE staff_monthly_salary 
          SET base_salary = ?, total_paid = ?, advance_amount = ?, 
              carry_forward_from_previous = ?, carry_forward_to_next = ?, 
              net_balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE staff_id = ? AND month = ? AND year = ?
        `, recordData);
        
        console.log(`📝 Updated record for ${staffMember.name}: Balance = ₹${netBalance}`);
      } else {
        // Insert new record
        await connection.execute(`
          INSERT INTO staff_monthly_salary (
            base_salary, total_paid, advance_amount,
            carry_forward_from_previous, carry_forward_to_next,
            net_balance, status, staff_id, month, year
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, recordData);
        
        console.log(`📝 Created record for ${staffMember.name}: Balance = ₹${netBalance}`);
      }
    }

    await connection.commit();
    console.log('✅ Auto carry forward completed successfully');

    res.json({
      success: true,
      message: `Auto carry forward completed for ${month}/${year}`,
      processed: staff.length
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error in auto carry forward:', error);
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

// Get monthly salary summary for all staff
router.get('/staff-salaries/monthly-summary/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params;
    console.log(`📊 Getting monthly summary for ${month}/${year}`);

    const query = `
      SELECT 
        sms.*,
        s.name,
        s.role,
        s.department,
        s.photo
      FROM staff_monthly_salary sms
      LEFT JOIN staff s ON sms.staff_id = s.id
      WHERE sms.month = ? AND sms.year = ?
      ORDER BY sms.net_balance DESC, s.name ASC
    `;

    const [rows] = await db.execute(query, [month, year]);

    // Calculate totals
    const summary = {
      total_staff: rows.length,
      total_salary: rows.reduce((sum, row) => sum + parseFloat(row.base_salary || 0), 0),
      total_paid: rows.reduce((sum, row) => sum + parseFloat(row.total_paid || 0), 0),
      total_advance: rows.reduce((sum, row) => sum + parseFloat(row.advance_amount || 0), 0),
      total_pending: rows.reduce((sum, row) => sum + parseFloat(row.net_balance || 0), 0),
      carry_forward_from_previous: rows.reduce((sum, row) => sum + parseFloat(row.carry_forward_from_previous || 0), 0),
      carry_forward_to_next: rows.reduce((sum, row) => sum + parseFloat(row.carry_forward_to_next || 0), 0)
    };

    console.log(`✅ Monthly summary calculated for ${rows.length} staff members`);
    res.json({
      success: true,
      data: rows,
      summary: summary,
      month: parseInt(month),
      year: parseInt(year)
    });

  } catch (error) {
    console.error('❌ Error getting monthly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly summary',
      error: error.message
    });
  }
});

// Save monthly records and carry forward balances (mirroring doctor salary functionality)
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
    
    console.log(`💾 Saving staff monthly records for ${month}/${year} with automatic carry forward...`);
    console.log(`🗓️ Applying join date filter: only staff who joined before or during ${month}/${year}`);
    
    await connection.beginTransaction();

    // First, let's get the previous month and year for carry forward
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }
    
    // Get all active staff with their current salary data
    // Apply same filtering logic as the display: only staff who joined before or during selected month
    const staffQuery = `
      SELECT 
        s.id,
        s.name,
        s.salary,
        s.join_date,
        COALESCE(
          (SELECT SUM(payment_amount) 
           FROM staff_salary_settlements 
           WHERE staff_id = s.id 
           AND MONTH(payment_date) = ? 
           AND YEAR(payment_date) = ?
          ), 0) as total_paid_this_month,
        COALESCE(
          (SELECT SUM(amount) 
           FROM staff_advance 
           WHERE staff_id = s.id 
           AND MONTH(date) = ? 
           AND YEAR(date) = ?
          ), 0) as advance_amount,
        COALESCE(
          (SELECT carry_forward_to_next 
           FROM staff_monthly_salary 
           WHERE staff_id = s.id 
           AND month = ? 
           AND year = ?
           LIMIT 1
          ), 0) as carry_forward_from_previous,
        s.join_date
      FROM staff s
      WHERE s.status = 'Active'
      AND s.deleted_at IS NULL
      AND (
        s.join_date IS NULL 
        OR s.join_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
      )
      ORDER BY s.id ASC
    `;

    const [staff] = await connection.execute(staffQuery, [
      month, year,  // for this month's payments
      month, year,  // for this month's advance
      prevMonth, prevYear,  // for carry forward from previous month
      year, month   // for join date filtering
    ]);

    console.log(`👥 Found ${staff.length} eligible staff members for ${month}/${year} (after join date filtering):`);
    staff.forEach(staffMember => {
      console.log(`  - ${staffMember.name} (${staffMember.id}): joined ${staffMember.join_date || 'N/A'}`);
    });

    let recordsProcessed = 0;
    let carryForwardUpdates = 0;
    
    for (const staffMember of staff) {
      // Calculate balance for this month
      const salary = parseFloat(staffMember.salary) || 0;
      const totalPaid = parseFloat(staffMember.total_paid_this_month) || 0;
      const advanceAmount = parseFloat(staffMember.advance_amount) || 0;
      const carryForwardFromPrevious = parseFloat(staffMember.carry_forward_from_previous) || 0;
      
      // Net Balance = Salary + Carry Forward From Previous - Total Paid - Advance
      const netBalance = salary + carryForwardFromPrevious - totalPaid - advanceAmount;
      
      // Carry forward to next month (only positive balances)
      const carryForwardToNext = netBalance > 0 ? netBalance : 0;
      
      // Check if record already exists for this staff member, month, year
      const [existingRecord] = await connection.execute(`
        SELECT id FROM staff_monthly_salary 
        WHERE staff_id = ? AND month = ? AND year = ?
      `, [staffMember.id, month, year]);
      
      const recordData = [
        salary,  // base_salary
        totalPaid,  // total_paid
        advanceAmount,  // advance_amount
        carryForwardFromPrevious,  // carry_forward_from_previous
        carryForwardToNext,  // carry_forward_to_next
        netBalance,  // net_balance
        netBalance <= 0 ? 'Paid' : 'Pending',  // status
        staffMember.id,
        month,
        year
      ];
      
      if (existingRecord.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE staff_monthly_salary 
          SET base_salary = ?, total_paid = ?, advance_amount = ?, 
              carry_forward_from_previous = ?, carry_forward_to_next = ?, 
              net_balance = ?, status = ?, updated_at = NOW()
          WHERE staff_id = ? AND month = ? AND year = ?
        `, recordData);
        
        console.log(`📝 Updated record for ${staffMember.name}: Balance ${netBalance.toFixed(2)}, Carry Forward: ${carryForwardToNext.toFixed(2)}`);
      } else {
        // Insert new record
        await connection.execute(`
          INSERT INTO staff_monthly_salary 
          (base_salary, total_paid, advance_amount, carry_forward_from_previous, 
           carry_forward_to_next, net_balance, status, staff_id, month, year, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, recordData);
        
        console.log(`📝 Created new record for ${staffMember.name}: Balance ${netBalance.toFixed(2)}, Carry Forward: ${carryForwardToNext.toFixed(2)}`);
      }
      
      recordsProcessed++;
      
      if (carryForwardToNext > 0) {
        carryForwardUpdates++;
      }
    }
    
    await connection.commit();
    console.log(`✅ Successfully processed ${recordsProcessed} staff records with ${carryForwardUpdates} carry-forward updates`);
    
    res.json({
      success: true,
      message: `Monthly records saved successfully for ${month}/${year}`,
      recordsProcessed,
      carryForwardUpdates,
      details: {
        month: parseInt(month),
        year: parseInt(year),
        staffProcessed: recordsProcessed,
        carryForwardApplied: carryForwardUpdates
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error saving staff monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly records',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Alternative endpoint path for consistency with UI calls
router.post('/staff-salaries/save-monthly-records', async (req, res) => {
  // Redirect to the main save-monthly-records endpoint
  req.url = '/save-monthly-records';
  return router.handle(req, res);
});

export default router;