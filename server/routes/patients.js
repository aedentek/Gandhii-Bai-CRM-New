import express from 'express';
import db from '../db/config.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fsPromises from 'fs/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import multer from 'multer';

// Helper function to convert dd-MM-yyyy to yyyy-MM-dd for MySQL
const convertDateFormat = (dateStr) => {
  if (!dateStr) return null;
  try {
    // Check if already in yyyy-MM-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Convert dd-MM-yyyy to yyyy-MM-dd
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      return `${year}-${month}-${day}`;
    }
    
    // If it's a Date object, convert to yyyy-MM-dd
    if (dateStr instanceof Date) {
      return dateStr.toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    console.error('Date conversion error:', error);
    return null;
  }
};

// Configure multer for patient file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Log what we receive in req.body during destination phase
    console.log('📁 [PATIENTS.JS] Destination phase - req.body:', req.body);
    
    const { patientId = 'temp' } = req.body;
    console.log('📁 [PATIENTS.JS] Extracted patientId:', patientId);
    
    // Create patient-specific directory: server/Photos/patient Admission/{patientId}
    const uploadPath = path.join(__dirname, '../Photos/patient Admission', patientId.toString());
    console.log('📁 [PATIENTS.JS] Creating directory:', uploadPath);
    
    // Create directory if it doesn't exist
    fsPromises.mkdir(uploadPath, { recursive: true }).then(() => {
      console.log('✅ [PATIENTS.JS] Directory created successfully:', uploadPath);
      cb(null, uploadPath);
    }).catch(err => {
      console.error('❌ [PATIENTS.JS] Error creating directory:', err);
      cb(err);
    });
  },
  filename: function (req, file, cb) {
    // Use a temporary filename first, we'll rename it later
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const tempFilename = `temp_${timestamp}${ext}`;
    
    console.log('📁 Generating temporary filename:', {
      originalName: file.originalname,
      tempFilename: tempFilename
    });
    
    cb(null, tempFilename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Accept any file type for images and audio uploads
  // If you want to restrict by field, you can check req.body.fileType or req.body.fieldName
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload endpoint for patient files
router.post('/upload-patient-file', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 [PATIENTS.JS] Upload request received:', {
      patientId: req.body.patientId,
      fieldName: req.body.fieldName,
      'typeof patientId': typeof req.body.patientId,
      'patientId length': req.body.patientId ? req.body.patientId.length : 'null',
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
        filename: req.file.filename
      } : 'No file'
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { patientId, fieldName } = req.body;
    
    if (!patientId || !fieldName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing patientId or fieldName' 
      });
    }

    // Generate new filename with fieldName prefix
    const timestamp = Date.now();
    const extension = path.extname(req.file.originalname);
    const newFilename = `${fieldName}_${timestamp}${extension}`;
    
    // Create patient-specific directory
    const serverDir = path.dirname(__filename);
    const patientDir = path.join(serverDir, '..', 'Photos', 'patient Admission', patientId);
    
    console.log('📁 [PATIENTS.JS] Creating patient directory:', patientDir);
    
    // Ensure patient directory exists
    if (!fs.existsSync(patientDir)) {
      fs.mkdirSync(patientDir, { recursive: true });
      console.log('✅ [PATIENTS.JS] Patient directory created:', patientDir);
    }
    
    // Move file from temp to patient folder
    const tempFilePath = req.file.path; // Current temp location
    const finalFilePath = path.join(patientDir, newFilename);
    
    console.log('🚚 [PATIENTS.JS] Moving file:', {
      from: tempFilePath,
      to: finalFilePath,
      patientId,
      fieldName
    });

    // Move the file from temp to patient folder
    fs.renameSync(tempFilePath, finalFilePath);
    console.log('✅ [PATIENTS.JS] File moved successfully to patient folder');

    // Verify file exists in patient folder
    console.log('🔍 [PATIENTS.JS] Verifying file in patient folder:', finalFilePath);
    const fileExists = fs.existsSync(finalFilePath);
    
    if (fileExists) {
      const stats = fs.statSync(finalFilePath);
      console.log('✅ [PATIENTS.JS] File verified in patient folder:', {
        path: finalFilePath,
        size: stats.size,
        exists: true
      });
    } else {
      console.log('❌ [PATIENTS.JS] File not found in patient folder');
      return res.status(500).json({
        success: false,
        error: 'File upload failed - file not found after move'
      });
    }

    // Return the relative path for storage in database
    const relativePath = path.join('Photos', 'patient Admission', patientId, newFilename).replace(/\\/g, '/');
    
    console.log('✅ [PATIENTS.JS] File uploaded successfully to patient folder:', relativePath);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: relativePath,
      filename: newFilename,
      originalName: req.file.originalname,
      size: req.file.size,
      fieldName: fieldName,
      patientId: patientId
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// Move patient files from temp to patient-specific folder
router.post('/move-patient-files', async (req, res) => {
  console.log('🚀 [DEBUG] move-patient-files endpoint hit!');
  try {
    const { patientId, tempPaths } = req.body;
    
    console.log('📂 [BACKEND] Move files request received:');
    console.log('  Patient ID:', patientId);
    console.log('  Temp paths:', tempPaths);
    console.log('  Request body:', req.body);
    
    if (!patientId || !tempPaths) {
      console.log('❌ [BACKEND] Missing required data');
      return res.status(400).json({
        success: false,
        error: 'Patient ID and temp paths are required'
      });
    }

    const newPaths = {};
    // Use patientId directly (it should already be in P0001 format)
    const patientFolder = path.join(__dirname, '../Photos/patient Admission', patientId);
    
    console.log('📂 [BACKEND] Target patient folder:', patientFolder);
    
    // Create patient-specific directory
    await fsPromises.mkdir(patientFolder, { recursive: true });
    console.log('✅ [BACKEND] Created/verified patient folder:', patientFolder);
    
    // Move each file from temp to patient folder
    for (const [fieldName, tempPath] of Object.entries(tempPaths)) {
      if (tempPath && typeof tempPath === 'string') {
        try {
          console.log(`📄 [BACKEND] Processing ${fieldName}: ${tempPath}`);
          
          // Extract filename from temp path
          const filename = path.basename(tempPath);
          const tempFilePath = path.join(__dirname, '..', tempPath);
          const newFilePath = path.join(patientFolder, filename);
          const newRelativePath = path.join('Photos', 'patient Admission', patientId, filename);
          
          console.log(`  Source: ${tempFilePath}`);
          console.log(`  Target: ${newFilePath}`);
          console.log(`  New path: ${newRelativePath}`);
          
          // Check if temp file exists
          const tempExists = await fsPromises.access(tempFilePath).then(() => true).catch(() => false);
          console.log(`  File exists: ${tempExists}`);
          
          if (tempExists) {
            // Move file from temp to patient folder
            await fsPromises.rename(tempFilePath, newFilePath);
            newPaths[fieldName] = newRelativePath;
            console.log(`✅ [BACKEND] Moved ${fieldName}: ${tempPath} -> ${newRelativePath}`);
          } else {
            console.log(`⚠️ [BACKEND] Temp file not found: ${tempFilePath}`);
            newPaths[fieldName] = tempPath; // Keep original path if file not found
          }
        } catch (error) {
          console.error(`❌ [BACKEND] Error moving ${fieldName}:`, error);
          newPaths[fieldName] = tempPath; // Keep original path on error
        }
      }
    }

    console.log('📂 [BACKEND] Final new paths:', newPaths);

    res.json({
      success: true,
      message: 'Files moved successfully',
      patientId: patientId,
      newPaths: newPaths
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] File move error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'File move failed'
    });
  }
});

router.post('/uploads', express.static(path.join(__dirname, 'uploads')));




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

// PUT /api/patient-attendance/:id
// PUT /api/patient-attendance/:id/status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        console.log('Updating attendance record:', id, status, notes);

        await db.query(`
            UPDATE patient_attendance
            SET status = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [status, notes, id]);

        const [updatedRecord] = await db.query(`
            SELECT 
                attendance.id,
                attendance.patient_id as patientId,
                patients.name as patientName,
                DATE_FORMAT(attendance.date, '%Y-%m-%d') as date,
                attendance.status,
                TIME_FORMAT(attendance.check_in_time, '%H:%i:%s') as checkInTime,
                attendance.notes
            FROM patient_attendance attendance
            LEFT JOIN patients ON attendance.patient_id = patients.id
            WHERE attendance.id = ?
        `, [id]);

        res.json(updatedRecord[0]);
    } catch (error) {
        console.error('Error updating attendance record:', error);
        res.status(500).json({ error: 'Failed to update attendance record' });
    }
});

// POST /api/patient-attendance/check-in
router.post('/patient-attendance/check-in', async (req, res) => {
    try {
        const { patientId, patientName, date, checkInTime, status = 'Present' } = req.body;
        console.log('Check-in request:', req.body);
        
        // Remove 'P' prefix from patientId
        const cleanPatientId = patientId.replace('P', '');
        
        // Check if patient already has attendance for today
        const [existingRecord] = await db.query(
            'SELECT * FROM patient_attendance WHERE patient_id = ? AND date = ?',
            [cleanPatientId, date]
        );

        if (existingRecord.length > 0) {
            // Update existing record
            await db.query(
                `UPDATE patient_attendance 
                 SET status = ?, check_in_time = ?, updated_at = NOW()
                 WHERE patient_id = ? AND date = ?`,
                [status, checkInTime, cleanPatientId, date]
            );
        } else {
            // Insert new record
            await db.query(
                `INSERT INTO patient_attendance 
                 (patient_id, date, status, check_in_time, notes)
                 VALUES (?, ?, ?, ?, ?)`,
                [cleanPatientId, date, status, checkInTime, '']
            );
        }

        // Get the updated/inserted record
        const [record] = await db.query(
            `SELECT 
                id,
                patient_id as patientId,
                date,
                status,
                check_in_time as checkInTime,
                check_out_time as checkOutTime,
                notes,
                updated_at as modifiedTime
             FROM patient_attendance 
             WHERE patient_id = ? AND date = ?`,
            [cleanPatientId, date]
        );

        res.json(record[0]);
    } catch (error) {
        console.error('Error handling check-in:', error);
        res.status(500).json({ error: 'Failed to record check-in' });
    }
});

// PUT /api/patient-attendance/:id/status
router.put('/patient-attendance/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        await db.query(
            `UPDATE patient_attendance 
             SET status = ?, notes = ?, updated_at = NOW()
             WHERE id = ?`,
            [status, notes, id]
        );

        const [record] = await db.query(
            `SELECT 
                id,
                patient_id as patientId,
                date,
                status,
                check_in_time as checkInTime,
                check_out_time as checkOutTime,
                notes,
                updated_at as modifiedTime
             FROM patient_attendance 
             WHERE id = ?`,
            [id]
        );

        res.json(record[0]);
    } catch (error) {
        console.error('Error updating attendance status:', error);
        res.status(500).json({ error: 'Failed to update attendance status' });
    }
});


// Removed duplicate upload-patient-file route - keeping the main one at line 86




// Database-based patient call records - no file initialization needed

// GET all patient call records (Database version)
router.get('/patient-call-records', async (req, res) => {
  console.log('✅ Patient call records requested');
  try {
    const [rows] = await db.execute('SELECT * FROM patient_call_records ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching patient call records:', error);
    res.status(500).json({ error: 'Failed to fetch patient call records' });
  }
});

// POST new patient call record (Database version)
router.post('/patient-call-records', async (req, res) => {
  console.log('✅ Add patient call record requested');
  console.log('📄 Request body:', req.body);
  try {
    const { 
      id, 
      patient_id, 
      patient_name, 
      date, 
      description, 
      audio_file_path, 
      audio_file_name, 
      audio_duration 
    } = req.body;

    // Convert patient_id to numeric for foreign key constraint
    const numericPatientId = parseInt(patient_id);
    if (isNaN(numericPatientId)) {
      console.error('❌ Invalid patient_id:', patient_id);
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    console.log(`🔍 Looking for patient with numeric ID: ${numericPatientId} (from ${patient_id})`);

    // First, verify patient exists
    const [patientCheck] = await db.execute('SELECT id FROM patients WHERE id = ?', [numericPatientId]);
    if (patientCheck.length === 0) {
      console.error('❌ Patient not found:', numericPatientId);
      return res.status(400).json({ error: `Patient ${patient_id} not found` });
    }

    console.log('✅ Patient found, proceeding with insert');

    // Generate ID if not provided
    const recordId = id || `call_${Date.now()}`;

    // Try to insert the record - use the numeric patient_id for foreign key constraint
    await db.execute(`
      INSERT INTO patient_call_records (
        id, patient_id, patient_name, date, description, 
        audio_file_path, audio_file_name, audio_duration, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [recordId, numericPatientId, patient_name, date, description, audio_file_path, audio_file_name, audio_duration]);

    console.log('✅ Patient call record added successfully');
    res.json({ success: true, message: 'Call record added successfully', id: recordId });
  } catch (error) {
    console.error('❌ Error adding patient call record:', error);
    console.error('❌ Full error details:', error.message);
    console.error('❌ SQL State:', error.sqlState);
    console.error('❌ Error Code:', error.code);
    res.status(500).json({ error: 'Failed to add patient call record', details: error.message });
  }
});

// PUT update patient call record (Database version)
router.put('/patient-call-records/:id', async (req, res) => {
  console.log('✅ Update patient call record requested for ID:', req.params.id);
  console.log('📄 Request body:', req.body);
  try {
    const { id } = req.params;
    const { 
      patient_id, 
      patient_name, 
      date, 
      description, 
      audio_file_path, 
      audio_file_name, 
      audio_duration 
    } = req.body;

    await db.execute(`
      UPDATE patient_call_records SET 
        patient_id = ?, patient_name = ?, date = ?, description = ?,
        audio_file_path = ?, audio_file_name = ?, audio_duration = ?
      WHERE id = ?
    `, [patient_id, patient_name, date, description, audio_file_path, audio_file_name, audio_duration, id]);

    console.log('✅ Patient call record updated successfully');
    res.json({ success: true, message: 'Call record updated successfully' });
  } catch (error) {
    console.error('❌ Error updating patient call record:', error);
    res.status(500).json({ error: 'Failed to update patient call record' });
  }
});


// Database-based endpoints don't need file initialization
// Removed legacy file initialization code

// DELETE patient call record (Database version)
router.delete('/patient-call-records/:id', async (req, res) => {
  console.log('✅ Delete patient call record requested for ID:', req.params.id);
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM patient_call_records WHERE id = ?', [id]);
    console.log('✅ Patient call record deleted successfully');
    res.json({ success: true, message: 'Call record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting patient call record:', error);
    res.status(500).json({ error: 'Failed to delete patient call record' });
  }
});


// Get all patients
router.get('/patients', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients WHERE is_deleted = FALSE ORDER BY created_at DESC');
    
    // Debug: Log first few patients' date information
    console.log('📅 [DEBUG] Sample patient date data:');
    rows.slice(0, 3).forEach((patient, idx) => {
      console.log(`  Patient ${idx + 1}:`, {
        id: patient.id,
        name: patient.name,
        admissionDate: patient.admissionDate,
        dateOfBirth: patient.dateOfBirth,
        admissionDateType: typeof patient.admissionDate,
        dateOfBirthType: typeof patient.dateOfBirth
      });
    });
    
    // Normalize photo paths for web use (convert backslashes to forward slashes)
    const normalizedPatients = rows.map(patient => ({
      ...patient,
      photo: patient.photo ? patient.photo.replace(/\\/g, '/') : null,
      patientAadhar: patient.patientAadhar ? patient.patientAadhar.replace(/\\/g, '/') : null,
      patientPan: patient.patientPan ? patient.patientPan.replace(/\\/g, '/') : null,
      attenderAadhar: patient.attenderAadhar ? patient.attenderAadhar.replace(/\\/g, '/') : null,
      attenderPan: patient.attenderPan ? patient.attenderPan.replace(/\\/g, '/') : null,
    }));
    
    console.log(`Retrieved ${rows.length} patients`);
    console.log('📋 Sample patient data (using actual database columns):', JSON.stringify(normalizedPatients[0], null, 2));
    res.json(normalizedPatients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single patient by ID
router.get('/patients/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients WHERE id = ? AND is_deleted = FALSE', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    
    // Normalize photo paths for web use
    const patient = {
      ...rows[0],
      photo: rows[0].photo ? rows[0].photo.replace(/\\/g, '/') : null,
      patientAadhar: rows[0].patientAadhar ? rows[0].patientAadhar.replace(/\\/g, '/') : null,
      patientPan: rows[0].patientPan ? rows[0].patientPan.replace(/\\/g, '/') : null,
      attenderAadhar: rows[0].attenderAadhar ? rows[0].attenderAadhar.replace(/\\/g, '/') : null,
      attenderPan: rows[0].attenderPan ? rows[0].attenderPan.replace(/\\/g, '/') : null,
    };
    
    res.json(patient);
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a patient
router.post('/patients', async (req, res) => {
  console.log('🔍 POST /patients - Request received');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Request headers:', req.headers);
  
  const {
    name, age, gender, phone, email, address, emergencyContact, medicalHistory,
    admissionDate, status, attenderName, attenderPhone, attenderRelationship,
    photo, patientAadhar, patientPan, attenderAadhar, attenderPan, fees, bloodTest, pickupCharge, totalAmount, payAmount, balance,
    paymentType, fatherName, motherName, dateOfBirth, marriageStatus, employeeStatus
  } = req.body;
  
  console.log('🔍 Extracted values:');
  console.log('  name:', name, '| type:', typeof name);
  console.log('  age:', age, '| type:', typeof age);
  console.log('  gender:', gender, '| type:', typeof gender);
  console.log('  phone:', phone, '| type:', typeof phone);
  console.log('  email:', email, '| type:', typeof email);
  console.log('  address:', address, '| type:', typeof address);
  console.log('  emergencyContact:', emergencyContact, '| type:', typeof emergencyContact);
  console.log('  status:', status, '| type:', typeof status);
  console.log('  photo:', photo, '| type:', typeof photo);
  
  // Validate and sanitize required fields
  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: 'Patient name is required and cannot be empty' });
  }
  
  if (!age || isNaN(Number(age)) || Number(age) <= 0) {
    return res.status(400).json({ error: 'Valid patient age is required' });
  }
  
  if (!gender || String(gender).trim() === '') {
    return res.status(400).json({ error: 'Patient gender is required' });
  }
  
  if (!phone || String(phone).trim() === '') {
    return res.status(400).json({ error: 'Patient phone is required' });
  }
  
  try {
    // FIRST: Check if patients table is empty and reset AUTO_INCREMENT if needed
    console.log('🔄 Checking AUTO_INCREMENT status before creating patient...');
    await checkAndResetAutoIncrement();
    
    // First, get the next ID to generate the patient_id
    const [maxIdResult] = await db.query('SELECT MAX(id) as maxId FROM patients');
    const nextId = (maxIdResult[0].maxId || 0) + 1;
    const patientId = `P${String(nextId).padStart(4, '0')}`; // Generate P0001, P0002, etc.
    
    console.log('🔍 Generated patient ID:', patientId);
    
    // Sanitize and prepare data for insertion - CORRECTED COLUMN NAMES!
    const sanitizedData = {
      patient_id: patientId,
      name: String(name || '').trim(),
      age: Number(age) || 0,
      gender: String(gender || '').trim(),
      phone: String(phone || '').trim(),
      email: String(email || '').trim(),
      address: String(address || '').trim(),
      emergencyContact: String(emergencyContact || '').trim(),
      medicalHistory: String(medicalHistory || '').trim(),
      // Fix date format: convert dd-MM-yyyy to yyyy-MM-dd for MySQL
      admissionDate: convertDateFormat(admissionDate) || new Date().toISOString().split('T')[0],
      status: String(status || 'Active').trim(),
      attenderName: String(attenderName || '').trim(),
      attenderPhone: String(attenderPhone || '').trim(),
      // CORRECTED: Use actual database column names from phpMyAdmin
      attenderRelationship: String(attenderRelationship || '').trim(),
      marriageStatus: String(marriageStatus || '').trim(),
      employeeStatus: String(employeeStatus || '').trim(),
      // Keep the old mappings for backward compatibility if columns exist
      guardian_relation: String(attenderRelationship || '').trim(),
      guardian_name: String(attenderName || '').trim(),
      guardian_phone: String(attenderPhone || '').trim(),
      marital_status: String(marriageStatus || '').trim(),
      occupation: String(employeeStatus || '').trim(),
      photo: String(photo || '').trim(),
      patientAadhar: String(patientAadhar || '').trim(),
      patientPan: String(patientPan || '').trim(),
      attenderAadhar: String(attenderAadhar || '').trim(),
      attenderPan: String(attenderPan || '').trim(),
      fees: Number(fees) || 0,
      bloodTest: Number(bloodTest) || 0,
      pickupCharge: Number(pickupCharge) || 0,
      otherFees: (Number(bloodTest) || 0) + (Number(pickupCharge) || 0), // Auto-calculate otherFees
      totalAmount: Number(totalAmount) || 0,
      payAmount: Number(payAmount) || 0,
      balance: (Number(totalAmount) || 0) - (Number(payAmount) || 0), // Calculate balance automatically
      paymentType: String(paymentType || '').trim(),
      fatherName: String(fatherName || '').trim(),
      motherName: String(motherName || '').trim(),
      // Fix date format: convert dd-MM-yyyy to yyyy-MM-dd for MySQL
      dateOfBirth: convertDateFormat(dateOfBirth) || new Date().toISOString().split('T')[0],
      // Add language preference default
      language_preference: 'English'
    };
    
    console.log('🔍 Sanitized data for insertion:', JSON.stringify(sanitizedData, null, 2));
    
    const sqlParams = [
      sanitizedData.patient_id, sanitizedData.name, sanitizedData.age, sanitizedData.gender, 
      sanitizedData.phone, sanitizedData.email, sanitizedData.address, sanitizedData.emergencyContact, 
      sanitizedData.medicalHistory, sanitizedData.admissionDate, sanitizedData.status, 
      sanitizedData.attenderName, sanitizedData.attenderPhone, 
      // CORRECTED: Include the actual database column names from phpMyAdmin
      sanitizedData.attenderRelationship, sanitizedData.marriageStatus, sanitizedData.employeeStatus,
      // Keep old columns for compatibility if they exist
      sanitizedData.guardian_name, sanitizedData.guardian_phone, sanitizedData.guardian_relation,
      sanitizedData.occupation, sanitizedData.marital_status, sanitizedData.language_preference,
      sanitizedData.photo, sanitizedData.patientAadhar, sanitizedData.patientPan, 
      sanitizedData.attenderAadhar, sanitizedData.attenderPan, sanitizedData.fees, 
      sanitizedData.bloodTest, sanitizedData.pickupCharge, sanitizedData.otherFees,
      sanitizedData.totalAmount, sanitizedData.payAmount, sanitizedData.balance, sanitizedData.paymentType, 
      sanitizedData.fatherName, sanitizedData.motherName, sanitizedData.dateOfBirth
    ];
    
    console.log('� Debug dateOfBirth value:', sanitizedData.dateOfBirth);
    console.log('📊 Final SQL Params count:', sqlParams.length);
    console.log('�📊 Final SQL Params:', sqlParams);
    
    const [result] = await db.query(
      `INSERT INTO patients (
        patient_id, name, age, gender, phone, email, address, emergencyContact, medicalHistory,
        admissionDate, status, attenderName, attenderPhone,
        attenderRelationship, marriageStatus, employeeStatus,
        guardian_name, guardian_phone, guardian_relation, occupation, marital_status, language_preference,
        photo, patientAadhar, patientPan, attenderAadhar, attenderPan, fees, bloodTest, pickupCharge, 
        otherFees, totalAmount, payAmount, balance, paymentType, fatherName, motherName, dateOfBirth
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      sqlParams
    );
    
    console.log('✅ Patient added successfully:', { 
      id: result.insertId, 
      patientId: sanitizedData.patient_id, 
      name: sanitizedData.name 
    });
    
    // Immediately query back what was inserted to verify
    console.log('🔍 [DEBUG] Querying back inserted patient with ID:', result.insertId);
    const [insertedPatientRows] = await db.query(
      'SELECT * FROM patients WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    
    if (insertedPatientRows.length > 0) {
      // Database already has correct column names, no mapping needed
      console.log('📋 [DEBUG] Actually inserted patient data (using correct database columns):', JSON.stringify(insertedPatientRows[0], null, 2));
    } else {
      console.log('❌ [DEBUG] No patient found with inserted ID:', result.insertId);
    }
    
    res.status(201).json({ 
      id: result.insertId,
      patient_id: sanitizedData.patient_id,
      message: 'Patient added successfully',
      patient: { 
        id: result.insertId, 
        patient_id: sanitizedData.patient_id, 
        name: sanitizedData.name,
        ...sanitizedData 
      }
    });
  } catch (err) {
    console.error('❌ Error adding patient:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Update a patient
router.put('/patients/:id', async (req, res) => {
  console.log('🔄 [UPDATE] PUT /patients/:id - Request received');
  console.log('🔄 [UPDATE] Patient ID:', req.params.id);
  console.log('🔄 [UPDATE] Request body:', JSON.stringify(req.body, null, 2));
  
  // Specifically check date fields in request
  console.log('🔄 [UPDATE] Date fields in request:');
  console.log('  - admissionDate:', req.body.admissionDate, '(type:', typeof req.body.admissionDate, ')');
  console.log('  - dateOfBirth:', req.body.dateOfBirth, '(type:', typeof req.body.dateOfBirth, ')');
  
  try {
    // Build dynamic UPDATE query to only update provided fields
    const updates = [];
    const values = [];
    
    // List of valid patient fields
    const validFields = [
      'name', 'age', 'gender', 'phone', 'email', 'address', 'emergencyContact', 'medicalHistory',
      'admissionDate', 'status', 'attenderName', 'attenderPhone', 'attenderRelationship',
      'photo', 'patientAadhar', 'patientPan', 'attenderAadhar', 'attenderPan', 
      'fees', 'bloodTest', 'pickupCharge', 'totalAmount', 'payAmount', 'balance',
      'paymentType', 'fatherName', 'motherName', 'dateOfBirth', 'marriageStatus', 'employeeStatus'
    ];
    
    // Only include fields that are actually present in the request body
    let hasFinancialUpdate = false;
    for (const field of validFields) {
      if (req.body.hasOwnProperty(field)) {
        // Skip balance field - we'll calculate it automatically if needed
        if (field === 'balance') {
          continue;
        }
        
        let fieldValue = req.body[field];
        
        // Special handling for date fields
        if (field === 'admissionDate' || field === 'dateOfBirth') {
          console.log(`📅 [UPDATE] Processing date field: ${field} = ${fieldValue}`);
          if (fieldValue && fieldValue !== '') {
            const convertedDate = convertDateFormat(fieldValue);
            console.log(`📅 [UPDATE] Converted ${field}: ${fieldValue} → ${convertedDate}`);
            fieldValue = convertedDate;
            if (!fieldValue) {
              console.log(`⚠️ [UPDATE] Invalid date format for ${field}: ${req.body[field]}, skipping...`);
              continue; // Skip invalid dates
            }
          } else {
            console.log(`📅 [UPDATE] Setting ${field} to NULL (empty value)`);
            fieldValue = null; // Set to NULL for empty dates
          }
        }
        
        updates.push(`${field}=?`);
        values.push(fieldValue);
        console.log(`🔄 [UPDATE] Adding field: ${field} = ${fieldValue}`);
        
        // Track if financial fields are being updated
        if (field === 'totalAmount' || field === 'payAmount') {
          hasFinancialUpdate = true;
        }
      }
    }
    
    // If financial fields are being updated, recalculate balance
    if (hasFinancialUpdate || req.body.hasOwnProperty('balance')) {
      // Get current patient data to calculate balance
      const [currentPatient] = await db.query('SELECT totalAmount, payAmount FROM patients WHERE id = ?', [req.params.id]);
      
      if (currentPatient.length > 0) {
        const currentTotal = Number(currentPatient[0].totalAmount) || 0;
        const currentPay = Number(currentPatient[0].payAmount) || 0;
        
        // Use new values if provided, otherwise use current values
        const newTotal = req.body.hasOwnProperty('totalAmount') ? (Number(req.body.totalAmount) || 0) : currentTotal;
        const newPay = req.body.hasOwnProperty('payAmount') ? (Number(req.body.payAmount) || 0) : currentPay;
        
        const calculatedBalance = newTotal - newPay;
        
        updates.push('balance=?');
        values.push(calculatedBalance);
        console.log(`🔄 [UPDATE] Auto-calculated balance: ${newTotal} - ${newPay} = ${calculatedBalance}`);
      }
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at=CURRENT_TIMESTAMP');
    
    if (updates.length === 1) { // Only updated_at was added
      console.log('⚠️ [UPDATE] No fields to update');
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    
    // Add the patient ID for the WHERE clause
    values.push(req.params.id);
    
    const query = `UPDATE patients SET ${updates.join(', ')} WHERE id=? AND is_deleted=FALSE`;
    console.log('🔄 [UPDATE] SQL Query:', query);
    console.log('🔄 [UPDATE] SQL Values:', values);
    
    const [result] = await db.query(query, values);
    
    if (result.affectedRows === 0) {
      console.log('❌ [UPDATE] Patient not found or no changes made');
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    console.log('✅ [UPDATE] Patient updated successfully:', { 
      id: req.params.id, 
      affectedRows: result.affectedRows,
      fieldsUpdated: updates.length - 1 // Exclude updated_at from count
    });
    
    // Verify date fields were saved correctly
    if (req.body.admissionDate || req.body.dateOfBirth) {
      console.log('🔍 [UPDATE] Verifying date updates...');
      const [verifyResult] = await db.query(
        'SELECT admissionDate, dateOfBirth FROM patients WHERE id = ?', 
        [req.params.id]
      );
      if (verifyResult.length > 0) {
        console.log('🔍 [UPDATE] Current dates in database:');
        console.log('  - admissionDate:', verifyResult[0].admissionDate);
        console.log('  - dateOfBirth:', verifyResult[0].dateOfBirth);
      }
    }
    
    res.json({ 
      id: req.params.id, 
      message: 'Patient updated successfully',
      fieldsUpdated: updates.length - 1,
      patient: { id: req.params.id, ...req.body }
    });
  } catch (err) {
    console.error('❌ [UPDATE] Error updating patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a patient
router.delete('/patients/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE patients SET is_deleted=TRUE, deleted_at=CURRENT_TIMESTAMP WHERE id=?',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Patient not found' });
    
    console.log('Patient soft deleted successfully:', req.params.id);
    res.json({ message: 'Patient deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- PATIENT PAYMENTS ENDPOINTS ---
// Get all payment records
router.get('/patient-payments', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patient_payments');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a payment record with automatic balance update
router.post('/patient-payments', async (req, res) => {
  const { patientId, date, amount, comment, paymentMode, balanceRemaining, createdBy, createdAt } = req.body;
  
  // Start a transaction for data consistency
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Insert the payment record
    const [result] = await connection.query(
      'INSERT INTO patient_payments (patientId, date, amount, comment, paymentMode, balanceRemaining, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patientId, date, amount, comment, paymentMode, balanceRemaining, createdBy, createdAt]
    );
    
    // Calculate new balance automatically
    const [totalPaidResult] = await connection.query(
      'SELECT COALESCE(SUM(amount), 0) as totalPaid FROM patient_payments WHERE patientId = ?',
      [patientId]
    );
    
    const [patientData] = await connection.query(
      'SELECT fees, otherFees, bloodTest, pickupCharge FROM patients WHERE id = ?',
      [patientId]
    );
    
    if (patientData.length > 0) {
      const patient = patientData[0];
      const totalFees = (Number(patient.fees) || 0) + (Number(patient.otherFees) || Number(patient.bloodTest) + Number(patient.pickupCharge) || 0);
      const totalPaid = Number(totalPaidResult[0].totalPaid);
      const newBalance = Math.max(0, totalFees - totalPaid);
      
      // Update patient record with new balance
      await connection.query(
        'UPDATE patients SET payAmount = ?, balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [totalPaid, newBalance, patientId]
      );
      
      console.log(`💰 Auto-updated patient ${patientId} balance:`, {
        totalFees,
        totalPaid,
        newBalance,
        paymentAmount: amount
      });
    }
    
    await connection.commit();
    res.status(201).json({ 
      id: result.insertId, 
      ...req.body,
      balanceUpdated: true,
      message: 'Payment added and patient balance updated automatically'
    });
    
  } catch (err) {
    await connection.rollback();
    console.error('Error adding payment and updating balance:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Update a payment record with automatic balance recalculation
router.put('/patient-payments/:id', async (req, res) => {
  const { patientId, date, amount, comment, paymentMode, balanceRemaining, createdBy, createdAt } = req.body;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get the old payment data first
    const [oldPayment] = await connection.query('SELECT patientId, amount FROM patient_payments WHERE id = ?', [req.params.id]);
    
    if (oldPayment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Payment record not found' });
    }
    
    // Update the payment record
    const [result] = await connection.query(
      'UPDATE patient_payments SET patientId=?, date=?, amount=?, comment=?, paymentMode=?, balanceRemaining=?, createdBy=?, createdAt=? WHERE id=?',
      [patientId, date, amount, comment, paymentMode, balanceRemaining, createdBy, createdAt, req.params.id]
    );
    
    // Function to update patient balance
    const updatePatientBalance = async (patId) => {
      const [totalPaidResult] = await connection.query(
        'SELECT COALESCE(SUM(amount), 0) as totalPaid FROM patient_payments WHERE patientId = ?',
        [patId]
      );
      
      const [patientData] = await connection.query(
        'SELECT fees, otherFees, bloodTest, pickupCharge FROM patients WHERE id = ?',
        [patId]
      );
      
      if (patientData.length > 0) {
        const patient = patientData[0];
        const totalFees = (Number(patient.fees) || 0) + (Number(patient.otherFees) || Number(patient.bloodTest) + Number(patient.pickupCharge) || 0);
        const totalPaid = Number(totalPaidResult[0].totalPaid);
        const newBalance = Math.max(0, totalFees - totalPaid);
        
        await connection.query(
          'UPDATE patients SET payAmount = ?, balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [totalPaid, newBalance, patId]
        );
        
        console.log(`💰 Auto-updated patient ${patId} balance: ₹${newBalance}`);
      }
    };
    
    // Update balance for current patient
    await updatePatientBalance(patientId);
    
    // If patient ID changed, also update the old patient's balance
    if (oldPayment[0].patientId !== patientId) {
      await updatePatientBalance(oldPayment[0].patientId);
    }
    
    await connection.commit();
    res.json({ 
      id: req.params.id, 
      ...req.body,
      balanceUpdated: true,
      message: 'Payment updated and patient balance recalculated automatically'
    });
    
  } catch (err) {
    await connection.rollback();
    console.error('Error updating payment and balance:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Delete a payment record
router.delete('/patient-payments/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM patient_payments WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment record not found' });
    res.json({ message: 'Payment record deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CASCADE DELETION ENDPOINTS FOR PATIENTS

// Delete all patient payments by patient ID
router.delete('/patient-payments/patient/:patientId', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM patient_payments WHERE patient_id=?', [req.params.patientId]);
    res.json({ 
      message: 'All patient payment records deleted successfully', 
      patientId: req.params.patientId,
      deletedCount: result.affectedRows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all patient history by patient ID
router.delete('/patient-history/patient/:patientId', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM patient_history WHERE patient_id=?', [req.params.patientId]);
    res.json({ 
      message: 'All patient history records deleted successfully', 
      patientId: req.params.patientId,
      deletedCount: result.affectedRows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all patient attendance by patient ID
router.delete('/patient-attendance/patient/:patientId', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM patient_attendance WHERE patient_id=?', [req.params.patientId]);
    res.json({ 
      message: 'All patient attendance records deleted successfully', 
      patientId: req.params.patientId,
      deletedCount: result.affectedRows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PATIENT ATTENDANCE CRUD ENDPOINTS ---

// Get all patient attendance records
router.get('/patient-attendance', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patient_attendance ORDER BY date DESC, patient_name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get patient attendance records for a specific patient
router.get('/patient-attendance/patient/:patientId', async (req, res) => {
  try {
    let query = 'SELECT * FROM patient_attendance WHERE patient_id=?';
    let params = [req.params.patientId];
    
    if (req.query.date) {
      query += ' AND date=?';
      params.push(req.query.date);
    }
    
    query += ' ORDER BY date DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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


// --- PATIENT HISTORY ENDPOINTS ---

// Get all patient history records
router.get('/patient-history', async (req, res) => {
  console.log('🔍 GET /patient-history endpoint called');
  try {
    // JOIN with patients table to get current patient name
    // Handle both numeric IDs and formatted patient IDs (P0101 format)
    const [rows] = await db.query(`
      SELECT 
        ph.*,
        COALESCE(ph.patient_name, p.name, p2.name) as patient_name
      FROM patient_history ph 
      LEFT JOIN patients p ON ph.patient_id = p.id 
      LEFT JOIN patients p2 ON ph.patient_id = p2.patient_id
      LEFT JOIN patients p3 ON CAST(REPLACE(ph.patient_id, 'P', '') AS UNSIGNED) = p3.id
      ORDER BY ph.date DESC, ph.created_at DESC
    `);
    console.log('✅ Patient history query successful, found:', rows.length, 'records');
    
    // Additional processing to ensure patient names are properly populated
    const processedRows = rows.map(row => {
      if (!row.patient_name || row.patient_name === null) {
        console.log(`⚠️ Patient name missing for patient_id: ${row.patient_id}, attempting to find manually...`);
        // We'll handle this case in the frontend for now
      }
      return row;
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error('❌ Patient history query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get patient history records for a specific patient
router.get('/patient-history/patient/:patientId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        ph.*,
        COALESCE(ph.patient_name, p.name) as patient_name
      FROM patient_history ph 
      LEFT JOIN patients p ON ph.patient_id = p.id 
      WHERE ph.patient_id = ? 
      ORDER BY ph.date DESC, ph.created_at DESC`,
      [req.params.patientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific patient history record
router.get('/patient-history/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        ph.*,
        COALESCE(ph.patient_name, p.name) as patient_name
      FROM patient_history ph 
      LEFT JOIN patients p ON ph.patient_id = p.id 
      WHERE ph.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient history record not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new patient history record
router.post('/patient-history', async (req, res) => {
  console.log('📝 POST /patient-history endpoint called');
  console.log('📝 Request body:', req.body);
  
  const {
    id,
    patient_id,
    patient_name,
    date,
    title,
    doctor,
    category,
    description,
    audio_recording,
    audio_file_name,
    audio_duration,
    documents_info
  } = req.body;
  
  try {
    console.log('💾 Attempting to insert patient history record...');
    const [result] = await db.query(
      `INSERT INTO patient_history (
        id, patient_id, patient_name, date, title, doctor, category, 
        description, audio_recording, audio_file_name, audio_duration, documents_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, patient_id, patient_name, date, title, doctor, category,
        description, audio_recording, audio_file_name, audio_duration,
        documents_info ? JSON.stringify(documents_info) : null
      ]
    );
    
    console.log('✅ Insert successful, result:', result);
    
    const [newRecord] = await db.query('SELECT * FROM patient_history WHERE id = ?', [id]);
    console.log('✅ Retrieved new record:', newRecord[0]);
    res.status(201).json(newRecord[0]);
  } catch (err) {
    console.error('❌ Insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update a patient history record
router.put('/patient-history/:id', async (req, res) => {
  const {
    patient_id,
    patient_name,
    date,
    title,
    doctor,
    category,
    description,
    audio_recording,
    audio_file_name,
    audio_duration,
    documents_info
  } = req.body;
  
  try {
    await db.query(
      `UPDATE patient_history SET 
        patient_id = ?, patient_name = ?, date = ?, title = ?, doctor = ?, 
        category = ?, description = ?, audio_recording = ?, audio_file_name = ?, 
        audio_duration = ?, documents_info = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        patient_id, patient_name, date, title, doctor, category,
        description, audio_recording, audio_file_name, audio_duration,
        documents_info ? JSON.stringify(documents_info) : null,
        req.params.id
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM patient_history WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a patient history record
router.delete('/patient-history/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM patient_history WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient history record not found' });
    }
    res.json({ message: 'Patient history record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get('/patient-medical-records', async (req, res) => {
  console.log('✅ Patient medical records requested');
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        patient_id,
        patient_name,
        date,
        record_type,
        description,
        images,
        created_at,
        created_by,
        updated_at
      FROM patient_medical_records 
      ORDER BY date DESC, created_at DESC
    `);
    
    // Parse images JSON field
    const records = rows.map(record => ({
      ...record,
      images: record.images ? JSON.parse(record.images) : []
    }));
    
    res.json(records);
  } catch (error) {
    console.error('❌ Error fetching patient medical records:', error);
    res.status(500).json({ error: 'Failed to fetch patient medical records' });
  }
});

// Add patient medical record
router.post('/patient-medical-records', async (req, res) => {
  console.log('✅ Add patient medical record requested');
  console.log('📄 Request body:', req.body);
  try {
    const { 
      id, 
      patient_id, 
      patient_name, 
      date, 
      record_type,
      description, 
      images,
      created_by 
    } = req.body;

    // Convert formatted patient ID (P0042) to numeric ID (42) for database lookup
    const numericPatientId = patient_id.toString().startsWith('P') ? parseInt(patient_id.toString().substring(1)) : patient_id;
    console.log(`🔍 Looking for patient with numeric ID: ${numericPatientId} (from ${patient_id})`);

    // First, verify patient exists
    const [patientCheck] = await db.execute('SELECT id FROM patients WHERE id = ?', [numericPatientId]);
    if (patientCheck.length === 0) {
      console.error('❌ Patient not found:', numericPatientId);
      return res.status(400).json({ error: `Patient ${patient_id} not found` });
    }

    console.log('✅ Patient found, proceeding with insert');

    // Insert the record
    await db.execute(`
      INSERT INTO patient_medical_records (
        id, patient_id, patient_name, date, record_type, description, 
        images, created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `, [id, numericPatientId, patient_name, date, record_type, description, JSON.stringify(images), created_by]);

    console.log('✅ Patient medical record added successfully');
    res.json({ success: true, message: 'Medical record added successfully' });
  } catch (error) {
    console.error('❌ Error adding patient medical record:', error);
    console.error('❌ Full error details:', error.message);
    res.status(500).json({ error: 'Failed to add patient medical record', details: error.message });
  }
});

// Update patient medical record
router.put('/patient-medical-records/:id', async (req, res) => {
  console.log('✅ Update patient medical record requested');
  console.log('📄 Request body:', req.body);
  try {
    const { id } = req.params;
    const { 
      patient_id, 
      patient_name, 
      date, 
      record_type,
      description, 
      images,
      created_by 
    } = req.body;

    // Convert formatted patient ID if needed
    const numericPatientId = patient_id.toString().startsWith('P') ? parseInt(patient_id.toString().substring(1)) : patient_id;

    // Update the record
    await db.execute(`
      UPDATE patient_medical_records 
      SET patient_id = ?, patient_name = ?, date = ?, record_type = ?, 
          description = ?, images = ?, created_by = ?, updated_at = NOW()
      WHERE id = ?
    `, [numericPatientId, patient_name, date, record_type, description, JSON.stringify(images), created_by, id]);

    console.log('✅ Patient medical record updated successfully');
    res.json({ success: true, message: 'Medical record updated successfully' });
  } catch (error) {
    console.error('❌ Error updating patient medical record:', error);
    res.status(500).json({ error: 'Failed to update patient medical record', details: error.message });
  }
});

// Delete patient medical record
router.delete('/patient-medical-records/:id', async (req, res) => {
  console.log('✅ Delete patient medical record requested');
  try {
    const { id } = req.params;

    // Get the record first to clean up files
    const [rows] = await db.execute('SELECT images FROM patient_medical_records WHERE id = ?', [id]);
    
    if (rows.length > 0) {
      const record = rows[0];
      const images = record.images ? JSON.parse(record.images) : [];
      
      // Clean up uploaded files
      images.forEach(imagePath => {
        try {
          const fullPath = path.join(__dirname, imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Deleted file: ${imagePath}`);
          }
        } catch (fileError) {
          console.error('❌ Error deleting file:', imagePath, fileError.message);
        }
      });
    }
    
    // Delete database record
    await db.execute('DELETE FROM patient_medical_records WHERE id = ?', [id]);

    console.log(`✅ Patient medical record deleted successfully - ID: ${id}`);
    res.json({ success: true, message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting patient medical record:', error);
    res.status(500).json({ error: 'Failed to delete patient medical record' });
  }
});


// Delete patient history record
router.delete('/patient-history/:id', async (req, res) => {
  console.log('✅ Delete patient history record requested');
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM patient_history WHERE id = ?', [id]);
    res.json({ success: true, message: 'Patient history record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting patient history:', error);
    res.status(500).json({ error: 'Failed to delete patient history record' });
  }
});


// Delete patient attendance (Reset)
router.delete('/patient-attendance', async (req, res) => {
  try {
    const { patientId, date } = req.body;
    console.log('📄 Delete request body:', req.body);
    
    if (!patientId || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await db.execute(
      'DELETE FROM patient_attendance WHERE patient_id = ? AND date = ?',
      [patientId, date]
    );
    
    console.log('✅ Deleted attendance record');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting patient attendance:', error);
    res.status(500).json({ error: 'Failed to delete patient attendance' });
  }
});

router.get('/patient-payments', async (req, res) => {
  console.log('✅ Patient payments requested');
  try {
    const [rows] = await db.execute('SELECT * FROM patient_payments ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching patient payments:', error);
    res.status(500).json({ error: 'Failed to fetch patient payments' });
  }
});

// Upload audio file for call records
router.post('/upload-call-record-audio', (req, res) => {
  console.log('📤 Call record audio upload request received');
  
  // Use multer with error handling for audio files
  upload.single('file')(req, res, function (err) {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({ 
        error: 'Call record audio upload error', 
        details: err.message 
      });
    }
    
    console.log('📄 Request body:', req.body);
    console.log('📎 Request file:', req.file ? { 
      fieldname: req.file.fieldname,
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype,
      size: req.file.size 
    } : 'No file');
    
    try {
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ error: 'No audio file uploaded' });
      }

      const { patientId } = req.body;
      
      if (!patientId) {
        console.log('❌ No patient ID provided');
        return res.status(400).json({ error: 'Patient ID is required' });
      }
      
      // Create directory for call record audio files
      const callRecordAudioDir = path.join(__dirname, '..', 'Photos', 'Patient Call Records', patientId, 'audio');
      
      console.log('📁 Creating call record audio directory:', callRecordAudioDir);
      
      // Ensure directory exists
      if (!fs.existsSync(callRecordAudioDir)) {
        fs.mkdirSync(callRecordAudioDir, { recursive: true });
        console.log('✅ Created call record audio directory');
      }
      
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = path.extname(req.file.originalname);
      const newFilename = `call_record_${timestamp}${fileExtension}`;
      const newFilePath = path.join(callRecordAudioDir, newFilename);
      
      // Move uploaded file to the correct location
      fs.renameSync(req.file.path, newFilePath);
      console.log('✅ Audio file moved to:', newFilePath);
      
      // Return the relative path for database storage and frontend access
      const relativePath = `Photos/Patient Call Records/${patientId}/audio/${newFilename}`;
      
      console.log('✅ Call record audio uploaded successfully:', relativePath);
      
      res.json({
        success: true,
        message: 'Call record audio uploaded successfully',
        filePath: relativePath,
        filename: newFilename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        patientId: patientId
      });
      
    } catch (error) {
      console.error('❌ Error processing call record audio upload:', error);
      res.status(500).json({ 
        error: 'Call record audio upload processing failed',
        details: error.message 
      });
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ status: 'OK', message: 'Server is running' });
});


// Removed duplicate upload-patient-file route - keeping the main one at line 86

// Patient History File Upload endpoint
router.post('/upload-medical-history-file', (req, res) => {
  console.log('📤 Patient history file upload request received');
  
  // Use multer with error handling
  upload.single('file')(req, res, function (err) {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({ 
        error: 'Patient history file upload error', 
        details: err.message 
      });
    }
    
    console.log('📄 Request body:', req.body);
    console.log('📎 Request file:', req.file ? { 
      fieldname: req.file.fieldname,
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype,
      size: req.file.size 
    } : 'No file');
    
    try {
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { patientId, fileType } = req.body;
      
      // Create subdirectory for patient history files in Photos structure
      const subDir = fileType === 'audio' ? 'audio' : 'documents';
      const patientHistoryDir = path.join(__dirname, '..', 'Photos', 'Patient History', patientId, subDir);
      
      console.log('📁 Creating directory:', patientHistoryDir);
      
      // Ensure directory exists
      if (!fs.existsSync(patientHistoryDir)) {
        console.log('📁 Directory does not exist, creating it...');
        fs.mkdirSync(patientHistoryDir, { recursive: true });
        console.log('📁 Directory created successfully');
      } else {
        console.log('📁 Directory already exists');
      }
      
      // Move file to patient history directory
      const oldPath = req.file.path;
      const newFilename = `${Date.now()}-${req.file.originalname}`;
      const newPath = path.join(patientHistoryDir, newFilename);
      
      console.log('📄 Moving file from:', oldPath);
      console.log('📄 Moving file to:', newPath);
      
      fs.renameSync(oldPath, newPath);
      console.log('📄 File moved successfully');
      
      // Verify file exists
      if (fs.existsSync(newPath)) {
        console.log('✅ File confirmed to exist at:', newPath);
      } else {
        console.log('❌ File does not exist at:', newPath);
      }
      
      const filePath = `/Photos/Patient History/${patientId}/${subDir}/${newFilename}`;
      console.log('✅ Patient history file uploaded successfully:', filePath);
      
      res.json({
        success: true,
        filePath: filePath,
        filename: newFilename,
        originalName: req.file.originalname,
        fileType: fileType
      });
    } catch (error) {
      console.error('❌ Error processing patient history upload:', error);
      res.status(500).json({ error: 'Patient history file upload processing failed' });
    }
  });
});

// Patient History Document Upload endpoint (saves to Patient Doctor Record folder)
router.post('/upload-patient-history-file', (req, res) => {
  console.log('📤 Patient history document upload request received');
  
  // Use multer with error handling
  upload.single('file')(req, res, function (err) {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({ 
        error: 'Patient history file upload error', 
        details: err.message 
      });
    }
    
    console.log('📄 Request body:', req.body);
    console.log('📎 Request file:', req.file ? { 
      fieldname: req.file.fieldname,
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype,
      size: req.file.size 
    } : 'No file');
    
    try {
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { patientId, fileType } = req.body;
      
      // Create subdirectory for patient history files in Photos structure
      const subDir = fileType === 'audio' ? 'audio' : 'documents';
      // Use the new patient Documents folder structure
      const patientHistoryDir = path.join(__dirname, '..', 'Photos', 'patient Documents', patientId, subDir);
      
      console.log('📁 Creating patient history directory:', patientHistoryDir);
      
      // Ensure directory exists
      if (!fs.existsSync(patientHistoryDir)) {
        console.log('📁 Directory does not exist, creating it...');
        fs.mkdirSync(patientHistoryDir, { recursive: true });
        console.log('📁 Directory created successfully');
      } else {
        console.log('📁 Directory already exists');
      }
      
      // Move file to patient history directory
      const oldPath = req.file.path;
      const newFilename = `${Date.now()}-${req.file.originalname}`;
      const newPath = path.join(patientHistoryDir, newFilename);
      
      console.log('📄 Moving file from:', oldPath);
      console.log('📄 Moving file to:', newPath);
      
      fs.renameSync(oldPath, newPath);
      console.log('📄 File moved successfully');
      
      // Verify file exists
      if (fs.existsSync(newPath)) {
        console.log('✅ File confirmed to exist at:', newPath);
      } else {
        console.log('❌ File does not exist at:', newPath);
      }
      
      const filePath = `/Photos/patient Documents/${patientId}/${subDir}/${newFilename}`;
      console.log('✅ Patient history file uploaded successfully:', filePath);
      
      res.json({
        success: true,
        filePath: filePath,
        filename: newFilename,
        originalName: req.file.originalname,
        fileType: fileType
      });
    } catch (error) {
      console.error('❌ Error processing patient history upload:', error);
      res.status(500).json({ error: 'Patient history file upload processing failed' });
    }
  });
});

// ===================================
// AUTO_INCREMENT RESET FUNCTION
// ===================================

/**
 * Reset the AUTO_INCREMENT counter for patients table to 1
 * This should be called when all patients are deleted to ensure 
 * new patients start from ID 1 instead of continuing from previous highest ID
 */
async function resetPatientsAutoIncrement() {
  try {
    console.log('🔄 Resetting patients table AUTO_INCREMENT to 1...');
    
    // Reset AUTO_INCREMENT to 1
    await db.query('ALTER TABLE patients AUTO_INCREMENT = 1');
    
    console.log('✅ Patients table AUTO_INCREMENT reset to 1 successfully');
    return true;
  } catch (error) {
    console.error('❌ Error resetting patients AUTO_INCREMENT:', error);
    throw error;
  }
}

/**
 * Check if patients table is empty and reset AUTO_INCREMENT if needed
 */
async function checkAndResetAutoIncrement() {
  try {
    // Check if table is empty
    const [rows] = await db.query('SELECT COUNT(*) as count FROM patients');
    const patientCount = rows[0].count;
    
    console.log(`📊 Current patient count: ${patientCount}`);
    
    if (patientCount === 0) {
      console.log('📋 Patients table is empty, resetting AUTO_INCREMENT...');
      await resetPatientsAutoIncrement();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking patient count:', error);
    throw error;
  }
}

// ===================================
// RESET ENDPOINT (for manual reset)
// ===================================

/**
 * Manual endpoint to reset AUTO_INCREMENT 
 * GET /api/patients/reset-auto-increment
 */
router.get('/reset-auto-increment', async (req, res) => {
  try {
    console.log('🔄 Manual AUTO_INCREMENT reset requested');
    
    const wasReset = await checkAndResetAutoIncrement();
    
    if (wasReset) {
      res.json({
        success: true,
        message: 'AUTO_INCREMENT reset to 1 successfully',
        resetPerformed: true
      });
    } else {
      const [rows] = await db.query('SELECT COUNT(*) as count FROM patients');
      res.json({
        success: true,
        message: `AUTO_INCREMENT not reset - table contains ${rows[0].count} patients`,
        resetPerformed: false,
        patientCount: rows[0].count
      });
    }
  } catch (error) {
    console.error('❌ Error in manual AUTO_INCREMENT reset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset AUTO_INCREMENT',
      details: error.message
    });
  }
});

export default router;
