import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

console.log('🩺 Doctor routes module loaded!');

// Simple test endpoint
router.get('/test-doctor-route', (req, res) => {
  console.log('🩺 Test doctor route hit!');
  res.json({ message: 'Doctor routes are working!' });
});

// Configure multer for doctor file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // For FormData uploads, body parameters are available in req.body during multer processing
    // But we need to ensure we handle the case where doctorId might not be available yet
    console.log('📂 Multer destination - Processing file:', file.fieldname);
    console.log('📂 Request body during destination:', req.body);
    
    // Use temp directory initially - we'll move files to proper directory after upload
    const tempPath = path.join(__dirname, '../Photos/Doctor Admission/temp');
    
    console.log('📂 Using temp upload path:', tempPath);
    
    // Create temp directory synchronously to avoid callback issues
    try {
      fs.mkdirSync(tempPath, { recursive: true });
      cb(null, tempPath);
    } catch (err) {
      console.error('Error creating directory:', err);
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const { fieldName = 'general' } = req.body;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${fieldName}_${timestamp}${ext}`;
    console.log('📂 Generating filename:', filename);
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

// Upload endpoint for doctor files
router.post('/upload-doctor-file', upload.single('file'), async (req, res) => {
  console.log('🩺 Doctor upload endpoint hit!');
  try {
    console.log('📤 Doctor upload request received:', {
      doctorId: req.body.doctorId,
      fieldName: req.body.fieldName,
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      } : 'No file'
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { doctorId, fieldName = 'general' } = req.body;
    
    console.log('📤 Extracted from body:', { doctorId, fieldName });
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        error: 'Doctor ID is required for file upload'
      });
    }

    // Move file from temp to proper doctor directory
    const properDoctorPath = path.join(__dirname, '../Photos/Doctor Admission', doctorId);
    console.log('📂 Creating doctor directory:', properDoctorPath);
    await fsPromises.mkdir(properDoctorPath, { recursive: true });
    
    const newFilePath = path.join(properDoctorPath, req.file.filename);
    
    console.log('📂 Moving file from temp to proper directory...');
    console.log('📂 From:', req.file.path);
    console.log('📂 To:', newFilePath);
    console.log('📂 Source file exists:', await fsPromises.access(req.file.path).then(() => true).catch(() => false));
    
    // Move file from temp to doctor directory
    try {
      await fsPromises.rename(req.file.path, newFilePath);
      console.log('✅ File moved successfully');
      console.log('📂 Destination file exists:', await fsPromises.access(newFilePath).then(() => true).catch(() => false));
    } catch (moveError) {
      console.error('❌ File move failed:', moveError);
      throw new Error(`Failed to move file: ${moveError.message}`);
    }

    // Return the relative path from server root
    const relativePath = path.join('Photos', 'Doctor Admission', doctorId, req.file.filename);
    
    console.log('✅ Doctor file uploaded and moved successfully:', relativePath);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      fieldName: fieldName,
      doctorId: doctorId
    });
    
  } catch (error) {
    console.error('❌ Doctor upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// Get monthly salary records for all doctors
router.get('/doctor/monthly-salary/:month/:year', async (req, res) => {
  let connection;
  try {
    const { month, year } = req.params;
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM doctor_monthly_salary WHERE month = ? AND year = ?',
      [month, year]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching monthly salaries:', error);
    res.status(500).json({ error: 'Failed to fetch monthly salaries' });
  } finally {
    if (connection) await connection.end();
  }
});

// Add new salary payment
router.post('/doctor/salary-payment', async (req, res) => {
  let connection;
  try {
    const {
      doctorId,
      paymentAmount,
      paymentDate,
      paymentMode,
      previousTotalPaid,
      newTotalPaid,
      notes,
      month,
      year,
      status
    } = req.body;

    connection = await mysql.createConnection(dbConfig);
    
    // Start transaction
    await connection.beginTransaction();

    // Add payment history record
    await connection.execute(
      `INSERT INTO doctor_salary_history (
        doctor_id, payment_amount, payment_date, payment_mode, 
        previous_total_paid, new_total_paid, month, year, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doctorId, paymentAmount, paymentDate, paymentMode, 
       previousTotalPaid, newTotalPaid, month, year, notes]
    );

    // Update monthly salary record
    await connection.execute(
      `INSERT INTO doctor_monthly_salary (
        doctor_id, month, year, total_paid, payment_mode, status
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        total_paid = VALUES(total_paid),
        payment_mode = VALUES(payment_mode),
        status = VALUES(status)`,
      [doctorId, month, year, newTotalPaid, paymentMode, status]
    );

    // Commit transaction
    await connection.commit();
    
    res.json({ message: 'Payment recorded successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  } finally {
    if (connection) await connection.end();
  }
});

// Get salary payment history for a doctor
router.get('/doctor/salary-history/:doctorId', async (req, res) => {
  let connection;
  try {
    const { doctorId } = req.params;
    connection = await mysql.createConnection(nfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM doctor_salary_history WHERE doctor_id = ? ORDER BY payment_date DESC',
      [doctorId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching salary history:', error);
    res.status(500).json({ error: 'Failed to fetch salary history' });
  } finally {
    if (connection) await connection.end();
  }
});

// Doctor Categories Endpoints
// Get all doctor categories
router.get('/doctor-categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctor_categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add doctor category
router.post('/doctor-categories', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO doctor_categories (name, description, status) VALUES (?, ?, ?)',
      [name, description || '', status || 'active']
    );
    const [newCategory] = await db.query('SELECT * FROM doctor_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(newCategory[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update doctor category
router.put('/doctor-categories/:id', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    await db.query(
      'UPDATE doctor_categories SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM doctor_categories WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete doctor category
router.delete('/doctor-categories/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM doctor_categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Doctor category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Doctors Endpoints
// Get all doctors (excluding deleted)
router.get('/doctors', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get deleted doctors
router.get('/doctors/deleted', async (req, res) => {
  try {
    // Ensure deleted columns exist first
    try {
      await db.query('ALTER TABLE doctors ADD COLUMN deleted_at TIMESTAMP NULL');
    } catch (err) {
      // Column already exists, ignore error
    }
    
    try {
      await db.query('ALTER TABLE doctors ADD COLUMN deleted_by VARCHAR(255) NULL');
    } catch (err) {
      // Column already exists, ignore error
    }
    
    const [rows] = await db.query('SELECT * FROM doctors WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    
    // Map database fields to frontend expected format
    const mrouteredRows = rows.map(doctor => ({
      ...doctor,
      deletedAt: doctor.deleted_at,
      deletedBy: doctor.deleted_by || 'System'
    }));
    
    res.json(mrouteredRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get next doctor ID
router.get('/doctors/next-id', async (req, res) => {
  try {
    // Only consider properly formatted 3-digit sequential IDs (DOC001, DOC002, etc.)
    const [rows] = await db.query("SELECT id FROM doctors WHERE id REGEXP '^DOC[0-9]{3}$' ORDER BY CAST(SUBSTRING(id, 4) AS UNSIGNED) DESC LIMIT 1");
    let nextId = 'DOC001';
    if (rows.length > 0) {
      const lastId = rows[0].id;
      const num = parseInt(lastId.replace('DOC', ''), 10);
      nextId = `DOC${String(num + 1).padStart(3, '0')}`;
    }
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get doctor by ID
router.get('/doctors/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new doctor
router.post('/doctors', async (req, res) => {
  const { 
    id, name, email, phone, address, specialization, department, 
    join_date, salary, status, photo, documents 
  } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO doctors (id, name, email, phone, address, specialization, department, join_date, salary, status, photo, documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, address, specialization, department, join_date, salary, status, photo, JSON.stringify(documents)]
    );
    const [newDoctor] = await db.query('SELECT * FROM doctors WHERE id = ?', [id]);
    res.status(201).json(newDoctor[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update doctor
router.put('/doctors/:id', async (req, res) => {
  const { 
    name, email, phone, address, specialization, department, 
    join_date, salary, status, photo, documents, total_paid, payment_mode
  } = req.body;
  try {
    let updateFields = [];
    let values = [];
    
    if (name !== undefined) { updateFields.push('name = ?'); values.push(name); }
    if (email !== undefined) { updateFields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updateFields.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { updateFields.push('address = ?'); values.push(address); }
    if (specialization !== undefined) { updateFields.push('specialization = ?'); values.push(specialization); }
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
    
    await db.query(
      `UPDATE doctors SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [updated] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete doctor
router.delete('/doctors/:id', async (req, res) => {
  try {
    const { deletedBy = 'System' } = req.body;
    
    // Add columns if they don't exist (for backward compatibility)
    try {
      await db.query('ALTER TABLE doctors ADD COLUMN deleted_at TIMESTAMP NULL');
      await db.query('ALTER TABLE doctors ADD COLUMN deleted_by VARCHAR(255) NULL');
    } catch (err) {
      // Columns might already exist, ignore error
    }
    
    // Soft delete the doctor
    await db.query(
      'UPDATE doctors SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?',
      [deletedBy, req.params.id]
    );
    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore deleted doctor
router.put('/doctors/:id/restore', async (req, res) => {
  try {
    await db.query(
      'UPDATE doctors SET deleted_at = NULL, deleted_by = NULL WHERE id = ?',
      [req.params.id]
    );
    const [restored] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    res.json(restored[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor Attendance Endpoints
// Get doctor attendance records
router.get('/doctor-attendance', async (req, res) => {
  try {
    const { date, doctor_id } = req.query;
    let query = 'SELECT * FROM doctor_attendance';
    let params = [];
    
    if (date || doctor_id) {
      query += ' WHERE';
      const conditions = [];
      if (date) {
        conditions.push(' date = ?');
        params.push(date);
      }
      if (doctor_id) {
        conditions.push(' doctor_id = ?');
        params.push(doctor_id);
      }
      query += conditions.join(' AND');
    }
    
    query += ' ORDER BY date DESC, doctor_id ASC';
    
    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS doctor_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id VARCHAR(20) NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        check_in TIME NULL,
        check_out TIME NULL,
        status ENUM('Present', 'Absent', 'Late', 'Half Day') NOT NULL DEFAULT 'Present',
        working_hours VARCHAR(10) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_doctor_date (doctor_id, date)
      )
    `);
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add/Update doctor attendance
router.post('/doctor-attendance', async (req, res) => {
  const { doctor_id, doctor_name, date, check_in, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO doctor_attendance (doctor_id, doctor_name, date, check_in, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), status = VALUES(status), updated_at = CURRENT_TIMESTAMP',
      [doctor_id, doctor_name, date, check_in || null, status || 'Present']
    );
    
    const [newRecord] = await db.query('SELECT * FROM doctor_attendance WHERE doctor_id = ? AND date = ?', [doctor_id, date]);
    res.status(201).json(newRecord[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update doctor attendance
router.put('/doctor-attendance/:id', async (req, res) => {
  const { check_in, check_out, status, working_hours } = req.body;
  try {
    await db.query(
      'UPDATE doctor_attendance SET check_in = ?, check_out = ?, status = ?, working_hours = ? WHERE id = ?',
      [check_in, check_out, status, working_hours, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM doctor_attendance WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete doctor attendance record
router.delete('/doctor-attendance/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM doctor_attendance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;