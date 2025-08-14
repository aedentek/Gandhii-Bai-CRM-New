import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Configure multer for staff file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { staffId = 'temp' } = req.body;
    // Create staff-specific directory: server/Photos/Staff Admission/{staffId}
    const uploadPath = path.join(__dirname, '../Photos/Staff Admission', staffId.toString());
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const { fieldName = 'general' } = req.body;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${fieldName}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDF/Word documents are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});



// Health check for staff module
router.get('/health', (req, res) => {
  console.log('✅ Staff module health check requested');
  res.json({ status: 'OK', message: 'Staff module is running' });
});

// Upload endpoint for staff files
router.post('/upload-staff-file', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Staff upload request received:', {
      staffId: req.body.staffId,
      fieldName: req.body.fieldName,
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file'
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Return the relative path from server root
    const relativePath = path.join('Photos', 'Staff Admission', req.body.staffId || 'temp', req.file.filename);
    
    console.log('✅ Staff file uploaded successfully:', relativePath);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      fieldName: req.body.fieldName || 'general',
      staffId: req.body.staffId || 'temp'
    });
    
  } catch (error) {
    console.error('❌ Staff upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// Get all staff (including soft deleted for admin purposes)
router.get('/staff', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE deleted_at IS NULL ORDER BY created_at DESC');
    // Parse documents JSON field for each staff member
    const parsedRows = rows.map(staff => ({
      ...staff,
      documents: staff.documents ? JSON.parse(staff.documents) : null
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get deleted staff
router.get('/staff/deleted', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get staff salary payment summary
router.get('/staff/salary-summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id, name, salary, total_paid, payment_mode, photo, join_date,
        (salary - COALESCE(total_paid, 0)) as balance
      FROM staff 
      WHERE deleted_at IS NULL AND status = 'Active'
      ORDER BY id
    `);
    
    // Calculate totals
    const totalSalary = rows.reduce((sum, staff) => sum + (parseFloat(staff.salary) || 0), 0);
    const totalPaid = rows.reduce((sum, staff) => sum + (parseFloat(staff.total_paid) || 0), 0);
    const totalPending = totalSalary - totalPaid;
    
    res.json({
      staff: rows,
      summary: {
        totalSalary,
        totalPaid,
        totalPending
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single staff member by ID
router.get('/staff/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Staff member not found' });
    
    // Parse documents JSON field
    const staff = {
      ...rows[0],
      documents: rows[0].documents ? JSON.parse(rows[0].documents) : null
    };
    
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a staff member
router.post('/staff', async (req, res) => {
  const { id, name, email, phone, address, role, department, join_date, salary, status, photo, documents } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO staff (id, name, email, phone, address, role, department, join_date, salary, status, photo, documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, address, role, department, join_date, salary, status, photo, JSON.stringify(documents)]
    );
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a staff member
router.put('/staff/:id', async (req, res) => {
  const { name, email, phone, address, role, department, join_date, salary, status, photo, documents, total_paid, payment_mode } = req.body;
  try {
    let updateFields = [];
    let values = [];
    
    if (name !== undefined) { updateFields.push('name = ?'); values.push(name); }
    if (email !== undefined) { updateFields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updateFields.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { updateFields.push('address = ?'); values.push(address); }
    if (role !== undefined) { updateFields.push('role = ?'); values.push(role); }
    if (department !== undefined) { updateFields.push('department = ?'); values.push(department); }
    if (join_date !== undefined) { updateFields.push('join_date = ?'); values.push(join_date); }
    if (salary !== undefined) { updateFields.push('salary = ?'); values.push(salary); }
    if (status !== undefined) { updateFields.push('status = ?'); values.push(status); }
    if (photo !== undefined) { updateFields.push('photo = ?'); values.push(photo); }
    if (documents !== undefined) { updateFields.push('documents = ?'); values.push(JSON.stringify(documents)); }
    if (total_paid !== undefined) { updateFields.push('total_paid = ?'); values.push(total_paid); }
    if (payment_mode !== undefined) { updateFields.push('payment_mode = ?'); values.push(payment_mode); }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    const [result] = await db.query(
      `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff member not found' });
    
    // Return updated staff data
    const [updated] = await db.query('SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    const updatedStaff = {
      ...updated[0],
      documents: updated[0].documents ? JSON.parse(updated[0].documents) : null
    };
    
    res.json(updatedStaff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete a staff member
router.delete('/staff/:id', async (req, res) => {
  const { deletedBy } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE staff SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL',
      [deletedBy || 'System', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ message: 'Staff member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore a soft deleted staff member
router.put('/staff/:id/restore', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE staff SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Deleted staff member not found' });
    res.json({ message: 'Staff member restored' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STAFF SALARY PAYMENT ENDPOINTS ---
// Update staff salary payment
router.put('/staff/:id/salary-payment', async (req, res) => {
  const { total_paid, payment_mode } = req.body;
  try {
    // Get current staff data to calculate balance
    const [staffRows] = await db.query('SELECT salary FROM staff WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (staffRows.length === 0) return res.status(404).json({ error: 'Staff member not found' });
    
    const salary = parseFloat(staffRows[0].salary) || 0;
    const totalPaid = parseFloat(total_paid) || 0;
    
    // Validate that total_paid doesn't exceed salary
    if (totalPaid > salary) {
      return res.status(400).json({ error: 'Total paid cannot exceed salary amount' });
    }
    
    const [result] = await db.query(
      'UPDATE staff SET total_paid = ?, payment_mode = ? WHERE id = ? AND deleted_at IS NULL',
      [totalPaid, payment_mode, req.params.id]
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff member not found' });
    
    // Return updated staff data with calculated balance
    const [updatedRows] = await db.query('SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    const updatedStaff = updatedRows[0];
    const balance = salary - totalPaid;
    
    res.json({
      ...updatedStaff,
      balance: balance,
      documents: updatedStaff.documents ? JSON.parse(updatedStaff.documents) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STAFF CATEGORIES CRUD ENDPOINTS ---
// Get all staff categories
router.get('/staff-categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff_categories ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single staff category by ID
router.get('/staff-categories/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff_categories WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Staff category not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a staff category
router.post('/staff-categories', async (req, res) => {
  const { name, description, status, quantity } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO staff_categories (name, description, status, quantity) VALUES (?, ?, ?, ?)',
      [name, description || '', status || 'active', quantity || 0]
    );
    res.status(201).json({ id: result.insertId, name, description, status });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update a staff category
router.put('/staff-categories/:id', async (req, res) => {
  const { name, description, status, quantity } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE staff_categories SET name=?, description=?, status=?, quantity=? WHERE id=?',
      [name, description || '', status || 'active', quantity || 0, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff category not found' });
    res.json({ id: req.params.id, name, description, status });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete a staff category
router.delete('/staff-categories/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM staff_categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff category not found' });
    res.json({ message: 'Staff category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all staff attendance records
router.get('/staff-attendance', async (req, res) => {
  try {
    const { date, staff_id } = req.query;
    let query = 'SELECT * FROM staff_attendance';
    let params = [];
    
    if (date && staff_id) {
      query += ' WHERE date = ? AND staff_id = ?';
      params = [date, staff_id];
    } else if (date) {
      query += ' WHERE date = ?';
      params = [date];
    } else if (staff_id) {
      query += ' WHERE staff_id = ?';
      params = [staff_id];
    }
    
    query += ' ORDER BY date DESC, staff_name ASC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark staff attendance
router.post('/staff-attendance', async (req, res) => {
  const { staff_id, staff_name, date, check_in, check_out, status, working_hours, notes } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO staff_attendance (staff_id, staff_name, date, check_in, check_out, status, working_hours, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       check_in = VALUES(check_in),
       check_out = VALUES(check_out),
       status = VALUES(status),
       working_hours = VALUES(working_hours),
       notes = VALUES(notes),
       updated_at = CURRENT_TIMESTAMP`,
      [staff_id, staff_name, date, check_in || null, check_out || null, status, working_hours || null, notes || null]
    );
    res.json({ 
      id: result.insertId || result.insertId, 
      staff_id, 
      staff_name, 
      date, 
      check_in, 
      check_out, 
      status, 
      working_hours, 
      notes 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update staff attendance
router.put('/staff-attendance/:id', async (req, res) => {
  const { check_in, check_out, status, working_hours, notes } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE staff_attendance SET check_in=?, check_out=?, status=?, working_hours=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [check_in || null, check_out || null, status, working_hours || null, notes || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ id: req.params.id, check_in, check_out, status, working_hours, notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete staff attendance record
router.delete('/staff-attendance/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM staff_attendance WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;