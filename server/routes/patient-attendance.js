// Enhanced Patient Attendance Routes with Fixed ID Handling
// Add this to replace the existing patient attendance routes in patients.js

// --- PATIENT ATTENDANCE CRUD ENDPOINTS ---

// GET /api/patient-attendance - Get all attendance records
router.get('/patient-attendance', async (req, res) => {
  console.log('📊 GET /patient-attendance requested');
  try {
    // Query with proper JOIN to get patient information
    const query = `
      SELECT 
        pa.id,
        pa.patient_id,
        COALESCE(p.name, pa.patient_name) as patient_name,
        COALESCE(p.phone, '') as patient_phone,
        p.photo as patient_image,
        DATE_FORMAT(pa.date, '%Y-%m-%d') as date,
        pa.status,
        TIME_FORMAT(pa.check_in_time, '%H:%i') as check_in_time,
        pa.notes,
        pa.created_at,
        pa.updated_at
      FROM patient_attendance pa
      LEFT JOIN patients p ON pa.patient_id = p.id
      ORDER BY pa.date DESC, pa.check_in_time DESC
    `;
    
    const [rows] = await db.query(query);
    
    console.log(`✅ Found ${rows.length} attendance records`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// GET /api/patient-attendance/patient/:patientId - Get attendance for specific patient
router.get('/patient-attendance/patient/:patientId', async (req, res) => {
  console.log('📊 GET patient attendance for specific patient');
  try {
    const { patientId } = req.params;
    const { date } = req.query;
    
    let query = `
      SELECT 
        pa.id,
        pa.patient_id,
        COALESCE(p.name, pa.patient_name) as patient_name,
        COALESCE(p.phone, '') as patient_phone,
        DATE_FORMAT(pa.date, '%Y-%m-%d') as date,
        pa.status,
        TIME_FORMAT(pa.check_in_time, '%H:%i') as check_in_time,
        pa.notes,
        pa.created_at,
        pa.updated_at
      FROM patient_attendance pa
      LEFT JOIN patients p ON pa.patient_id = p.id
      WHERE pa.patient_id = ?
    `;
    
    const params = [patientId];
    
    if (date) {
      query += ' AND pa.date = ?';
      params.push(date);
    }
    
    query += ' ORDER BY pa.date DESC';
    
    const [rows] = await db.query(query, params);
    
    console.log(`✅ Found ${rows.length} attendance records for patient ${patientId}`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching patient attendance:', error);
    res.status(500).json({ error: 'Failed to fetch patient attendance' });
  }
});

// POST /api/patient-attendance - Add new attendance record
router.post('/patient-attendance', async (req, res) => {
  console.log('📝 POST /patient-attendance requested');
  console.log('📄 Request body:', req.body);
  
  try {
    const { patientId, patientName, date, status, checkInTime, notes } = req.body;
    
    // Validate required fields
    if (!patientId || !patientName || !date || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: patientId, patientName, date, status' 
      });
    }

    // Check if attendance record already exists for this patient on this date
    const [existingRecord] = await db.query(
      'SELECT id FROM patient_attendance WHERE patient_id = ? AND date = ?',
      [patientId, date]
    );

    if (existingRecord.length > 0) {
      return res.status(400).json({ 
        error: 'Attendance record already exists for this patient on this date' 
      });
    }

    // Insert new attendance record
    const [result] = await db.query(
      `INSERT INTO patient_attendance 
       (patient_id, patient_name, date, status, check_in_time, notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [patientId, patientName, date, status, checkInTime || null, notes || '']
    );

    // Return the created record
    const [newRecord] = await db.query(
      `SELECT 
        pa.id,
        pa.patient_id,
        pa.patient_name,
        DATE_FORMAT(pa.date, '%Y-%m-%d') as date,
        pa.status,
        TIME_FORMAT(pa.check_in_time, '%H:%i') as check_in_time,
        pa.notes,
        pa.created_at,
        pa.updated_at
       FROM patient_attendance pa 
       WHERE pa.id = ?`,
      [result.insertId]
    );

    console.log('✅ Attendance record created:', newRecord[0]);
    res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error('❌ Error creating attendance record:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Attendance record already exists for this patient on this date' });
    } else {
      res.status(500).json({ error: 'Failed to create attendance record' });
    }
  }
});

// PUT /api/patient-attendance/:id - Update attendance record
router.put('/patient-attendance/:id', async (req, res) => {
  console.log('🔄 PUT /patient-attendance/:id requested');
  console.log('📄 Request body:', req.body);
  
  try {
    const { id } = req.params;
    const { status, checkInTime, notes } = req.body;
    
    // Validate that record exists
    const [existingRecord] = await db.query(
      'SELECT id FROM patient_attendance WHERE id = ?',
      [id]
    );

    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Build update query dynamically
    let updateFields = [];
    let values = [];
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      values.push(status);
    }
    
    if (checkInTime !== undefined) {
      updateFields.push('check_in_time = ?');
      values.push(checkInTime);
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(notes);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    if (updateFields.length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    // Execute update
    const [result] = await db.query(
      `UPDATE patient_attendance SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    // Return updated record
    const [updatedRecord] = await db.query(
      `SELECT 
        pa.id,
        pa.patient_id,
        pa.patient_name,
        DATE_FORMAT(pa.date, '%Y-%m-%d') as date,
        pa.status,
        TIME_FORMAT(pa.check_in_time, '%H:%i') as check_in_time,
        pa.notes,
        pa.created_at,
        pa.updated_at
       FROM patient_attendance pa 
       WHERE pa.id = ?`,
      [id]
    );
    
    console.log('✅ Attendance record updated:', updatedRecord[0]);
    res.json(updatedRecord[0]);
  } catch (error) {
    console.error('❌ Error updating attendance record:', error);
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
});

// DELETE /api/patient-attendance/:id - Delete attendance record by ID
router.delete('/patient-attendance/:id', async (req, res) => {
  console.log('🗑️ DELETE /patient-attendance/:id requested');
  
  try {
    const { id } = req.params;
    
    // Check if record exists
    const [existingRecord] = await db.query(
      'SELECT id, patient_name, date FROM patient_attendance WHERE id = ?',
      [id]
    );

    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Delete the record
    const [result] = await db.query('DELETE FROM patient_attendance WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    console.log('✅ Attendance record deleted:', existingRecord[0]);
    res.json({ 
      success: true, 
      message: 'Attendance record deleted successfully',
      deletedRecord: existingRecord[0]
    });
  } catch (error) {
    console.error('❌ Error deleting attendance record:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

// DELETE /api/patient-attendance/patient/:patientId - Delete all attendance for a patient
router.delete('/patient-attendance/patient/:patientId', async (req, res) => {
  console.log('🗑️ DELETE all attendance for patient requested');
  
  try {
    const { patientId } = req.params;
    
    // Delete all attendance records for the patient
    const [result] = await db.query(
      'DELETE FROM patient_attendance WHERE patient_id = ?',
      [patientId]
    );
    
    console.log(`✅ Deleted ${result.affectedRows} attendance records for patient ${patientId}`);
    res.json({ 
      success: true, 
      message: `Deleted ${result.affectedRows} attendance records`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('❌ Error deleting patient attendance records:', error);
    res.status(500).json({ error: 'Failed to delete patient attendance records' });
  }
});

// POST /api/patient-attendance/bulk - Bulk mark attendance
router.post('/patient-attendance/bulk', async (req, res) => {
  console.log('📝 POST /patient-attendance/bulk requested');
  
  try {
    const { attendanceRecords } = req.body;
    
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ error: 'attendanceRecords must be a non-empty array' });
    }

    const results = [];
    const errors = [];

    // Process each attendance record
    for (const record of attendanceRecords) {
      try {
        const { patientId, patientName, date, status, checkInTime, notes } = record;
        
        if (!patientId || !patientName || !date || !status) {
          errors.push({
            record,
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if record already exists
        const [existing] = await db.query(
          'SELECT id FROM patient_attendance WHERE patient_id = ? AND date = ?',
          [patientId, date]
        );

        if (existing.length > 0) {
          // Update existing record
          await db.query(
            `UPDATE patient_attendance 
             SET status = ?, check_in_time = ?, notes = ?, updated_at = NOW()
             WHERE patient_id = ? AND date = ?`,
            [status, checkInTime || null, notes || '', patientId, date]
          );
          results.push({ patientId, patientName, action: 'updated' });
        } else {
          // Insert new record
          await db.query(
            `INSERT INTO patient_attendance 
             (patient_id, patient_name, date, status, check_in_time, notes, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [patientId, patientName, date, status, checkInTime || null, notes || '']
          );
          results.push({ patientId, patientName, action: 'created' });
        }
      } catch (recordError) {
        errors.push({
          record,
          error: recordError.message
        });
      }
    }

    console.log(`✅ Processed ${results.length} records, ${errors.length} errors`);
    res.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('❌ Error processing bulk attendance:', error);
    res.status(500).json({ error: 'Failed to process bulk attendance' });
  }
});

// GET /api/patient-attendance/stats - Get attendance statistics
router.get('/patient-attendance/stats', async (req, res) => {
  console.log('📊 GET /patient-attendance/stats requested');
  
  try {
    const { date, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
        DATE_FORMAT(date, '%Y-%m-%d') as record_date
      FROM patient_attendance
    `;
    
    const params = [];
    const conditions = [];
    
    if (date) {
      conditions.push('date = ?');
      params.push(date);
    } else if (startDate && endDate) {
      conditions.push('date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    if (!date) {
      query += ' GROUP BY date ORDER BY date DESC';
    }
    
    const [rows] = await db.query(query, params);
    
    // Also get total active patients count
    const [patientCount] = await db.query(
      "SELECT COUNT(*) as total_patients FROM patients WHERE status = 'Active'"
    );
    
    const stats = {
      totalActivePatients: patientCount[0].total_patients,
      attendanceStats: rows
    };
    
    console.log('✅ Attendance stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
});

module.exports = router;
