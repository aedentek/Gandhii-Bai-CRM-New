import express from 'express';
import db from '../db/config.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Configure multer for medical record images
const medicalRecordStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get patient ID from request body or form data
    const patientId = req.body.patientId || 'unknown';
    
    // Create path: server/Photos/Patient Medical Records/{patientId}/
    const uploadPath = path.join(__dirname, '..', 'Photos', 'Patient Medical Records', patientId.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`📁 Created directory: ${uploadPath}`);
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename: recordType_timestamp.ext
    const recordType = (req.body.recordType || 'record').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${recordType}_${timestamp}${ext}`;
    console.log(`📄 Saving file as: ${filename}`);
    cb(null, filename);
  }
});

const uploadMedicalImages = multer({
  storage: medicalRecordStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF, WEBP) are allowed'));
    }
  }
});

// GET /medical-records - Get all medical records
router.get('/medical-records', async (req, res) => {
  console.log('✅ Medical records requested');
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        patient_id as patientId,
        patient_name as patientName,
        date,
        record_type as recordType,
        description,
        images,
        created_at as createdAt,
        created_by as createdBy
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
    console.error('❌ Error fetching medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// POST /medical-records - Add new medical record
router.post('/medical-records', uploadMedicalImages.array('images', 10), async (req, res) => {
  console.log('✅ Add medical record requested');
  try {
    const { patientId, patientName, recordType, description, date } = req.body;
    
    // Validate required fields
    if (!patientId || !patientName || !recordType || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process uploaded images - update paths to match new folder structure
    const imagePaths = req.files ? req.files.map(file => {
      // Generate path relative to server root: /Photos/Patient Medical Records/{patientId}/{filename}
      return `/Photos/Patient Medical Records/${patientId}/${file.filename}`;
    }) : [];
    
    const query = `
      INSERT INTO patient_medical_records 
      (patient_id, patient_name, date, record_type, description, images, created_at, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), 'system')
    `;
    
    const values = [
      patientId,
      patientName,
      date,
      recordType,
      description,
      JSON.stringify(imagePaths)
    ];
    
    const [result] = await db.execute(query, values);
    
    console.log(`✅ Medical record added successfully - ID: ${result.insertId}`);
    console.log(`📁 Images uploaded: ${imagePaths.length} files`);
    
    res.json({ 
      success: true, 
      message: 'Medical record added successfully',
      id: result.insertId,
      images: imagePaths
    });
  } catch (error) {
    console.error('❌ Error adding medical record:', error);
    res.status(500).json({ error: 'Failed to add medical record' });
  }
});

// PUT /medical-records/:id - Update medical record
router.put('/medical-records/:id', uploadMedicalImages.array('images', 10), async (req, res) => {
  console.log('✅ Update medical record requested');
  try {
    const { id } = req.params;
    const { patientId, patientName, recordType, description, date } = req.body;
    
    // Validate required fields
    if (!patientId || !patientName || !recordType || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get existing record to preserve existing images if no new ones uploaded
    const [existingRows] = await db.execute('SELECT images FROM patient_medical_records WHERE id = ?', [id]);
    let existingImages = [];
    if (existingRows.length > 0 && existingRows[0].images) {
      existingImages = JSON.parse(existingRows[0].images);
    }
    
    // Process new uploaded images
    const newImagePaths = req.files ? req.files.map(file => `/uploads/medical-records/${file.filename}`) : [];
    
    // Combine existing and new images (for this implementation, we'll replace all images)
    // In a production system, you might want to handle adding/removing specific images
    const finalImagePaths = newImagePaths.length > 0 ? newImagePaths : existingImages;
    
    const query = `
      UPDATE patient_medical_records 
      SET patient_id = ?, patient_name = ?, date = ?, record_type = ?, description = ?, images = ?
      WHERE id = ?
    `;
    
    const values = [
      patientId,
      patientName,
      date,
      recordType,
      description,
      JSON.stringify(finalImagePaths),
      id
    ];
    
    await db.execute(query, values);
    
    console.log(`✅ Medical record updated successfully - ID: ${id}`);
    console.log(`📁 Images: ${finalImagePaths.length} files`);
    
    res.json({ 
      success: true, 
      message: 'Medical record updated successfully',
      images: finalImagePaths
    });
  } catch (error) {
    console.error('❌ Error updating medical record:', error);
    res.status(500).json({ error: 'Failed to update medical record' });
  }
});

// DELETE /medical-records/:id - Delete medical record
router.delete('/medical-records/:id', async (req, res) => {
  console.log('✅ Delete medical record requested');
  try {
    const { id } = req.params;
    
    // Get record to delete associated image files
    const [rows] = await db.execute('SELECT images FROM patient_medical_records WHERE id = ?', [id]);
    
    if (rows.length > 0 && rows[0].images) {
      const imagePaths = JSON.parse(rows[0].images);
      
      // Delete image files from server
      imagePaths.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', '..', imagePath.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Deleted image file: ${fullPath}`);
          } catch (error) {
            console.warn(`⚠️ Could not delete image file: ${fullPath}`, error.message);
          }
        }
      });
    }
    
    // Delete database record
    await db.execute('DELETE FROM patient_medical_records WHERE id = ?', [id]);
    
    console.log(`✅ Medical record deleted successfully - ID: ${id}`);
    res.json({ success: true, message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting medical record:', error);
    res.status(500).json({ error: 'Failed to delete medical record' });
  }
});

// Patient Medical Records endpoints (aliases for compatibility)
router.get('/patient-medical-records', async (req, res) => {
  console.log('✅ Patient medical records requested');
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        patient_id as patientId,
        patient_name as patientName,
        date,
        record_type as recordType,
        description,
        images,
        created_at as createdAt,
        created_by as createdBy
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

router.post('/patient-medical-records', uploadMedicalImages.array('images', 10), async (req, res) => {
  console.log('✅ Add patient medical record requested');
  try {
    const { patientId, patientName, recordType, description, date } = req.body;
    
    // Validate required fields
    if (!patientId || !patientName || !recordType || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process uploaded images - update paths to match new folder structure
    const imagePaths = req.files ? req.files.map(file => {
      // Generate path relative to server root: /Photos/Patient Medical Records/{patientId}/{filename}
      return `/Photos/Patient Medical Records/${patientId}/${file.filename}`;
    }) : [];
    
    const query = `
      INSERT INTO patient_medical_records 
      (patient_id, patient_name, date, record_type, description, images, created_at, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), 'system')
    `;
    
    const values = [
      patientId,
      patientName,
      date,
      recordType,
      description,
      JSON.stringify(imagePaths)
    ];
    
    const [result] = await db.execute(query, values);
    
    console.log(`✅ Patient medical record added successfully - ID: ${result.insertId}`);
    console.log(`📁 Images uploaded: ${imagePaths.length} files`);
    
    res.json({ 
      success: true, 
      message: 'Patient medical record added successfully',
      id: result.insertId,
      images: imagePaths
    });
  } catch (error) {
    console.error('❌ Error adding patient medical record:', error);
    res.status(500).json({ error: 'Failed to add patient medical record' });
  }
});

router.put('/patient-medical-records/:id', uploadMedicalImages.array('images', 10), async (req, res) => {
  console.log('✅ Update patient medical record requested');
  try {
    const { id } = req.params;
    const { patientId, patientName, recordType, description, date } = req.body;
    
    // Validate required fields
    if (!patientId || !patientName || !recordType || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get existing record to preserve existing images if no new ones uploaded
    const [existingRows] = await db.execute('SELECT images FROM patient_medical_records WHERE id = ?', [id]);
    let existingImages = [];
    if (existingRows.length > 0 && existingRows[0].images) {
      existingImages = JSON.parse(existingRows[0].images);
    }
    
    // Process new uploaded images - update paths to match new folder structure
    const newImagePaths = req.files ? req.files.map(file => {
      // Generate path relative to server root: /Photos/Patient Medical Records/{patientId}/{filename}
      return `/Photos/Patient Medical Records/${patientId}/${file.filename}`;
    }) : [];
    
    // Combine existing and new images (for this implementation, we'll replace all images)
    const finalImagePaths = newImagePaths.length > 0 ? newImagePaths : existingImages;
    
    const query = `
      UPDATE patient_medical_records 
      SET patient_id = ?, patient_name = ?, date = ?, record_type = ?, description = ?, images = ?
      WHERE id = ?
    `;
    
    const values = [
      patientId,
      patientName,
      date,
      recordType,
      description,
      JSON.stringify(finalImagePaths),
      id
    ];
    
    await db.execute(query, values);
    
    console.log(`✅ Patient medical record updated successfully - ID: ${id}`);
    console.log(`📁 Images: ${finalImagePaths.length} files`);
    
    res.json({ 
      success: true, 
      message: 'Patient medical record updated successfully',
      images: finalImagePaths
    });
  } catch (error) {
    console.error('❌ Error updating patient medical record:', error);
    res.status(500).json({ error: 'Failed to update patient medical record' });
  }
});

router.delete('/patient-medical-records/:id', async (req, res) => {
  console.log('✅ Delete patient medical record requested');
  try {
    const { id } = req.params;
    
    // Get record to delete associated image files
    const [rows] = await db.execute('SELECT images FROM patient_medical_records WHERE id = ?', [id]);
    
    if (rows.length > 0 && rows[0].images) {
      const imagePaths = JSON.parse(rows[0].images);
      
      // Delete image files from server
      imagePaths.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', '..', imagePath.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Deleted image file: ${fullPath}`);
          } catch (error) {
            console.warn(`⚠️ Could not delete image file: ${fullPath}`, error.message);
          }
        }
      });
    }
    
    // Delete database record
    await db.execute('DELETE FROM patient_medical_records WHERE id = ?', [id]);
    
    console.log(`✅ Patient medical record deleted successfully - ID: ${id}`);
    res.json({ success: true, message: 'Patient medical record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting patient medical record:', error);
    res.status(500).json({ error: 'Failed to delete patient medical record' });
  }
});

// POST /patient-medical-records/json - Add new medical record with JSON data (files already uploaded)
router.post('/patient-medical-records/json', express.json(), async (req, res) => {
  console.log('✅ Add patient medical record (JSON) requested');
  try {
    const { patient_id, patient_name, date, record_type, description, images, created_by } = req.body;
    
    // Validate required fields
    if (!patient_id || !patient_name || !record_type || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `
      INSERT INTO patient_medical_records 
      (patient_id, patient_name, date, record_type, description, images, created_at, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;
    
    const values = [
      patient_id,
      patient_name,
      date,
      record_type,
      description,
      JSON.stringify(images || []),
      created_by || 'system'
    ];
    
    const [result] = await db.execute(query, values);
    
    console.log(`✅ Patient medical record added successfully (JSON) - ID: ${result.insertId}`);
    console.log(`📁 Images saved: ${images?.length || 0} files`);
    
    res.json({ 
      success: true, 
      message: 'Patient medical record added successfully',
      id: result.insertId,
      images: images || []
    });
  } catch (error) {
    console.error('❌ Error adding patient medical record (JSON):', error);
    res.status(500).json({ error: 'Failed to add patient medical record' });
  }
});

export default router;
