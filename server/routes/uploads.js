import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // At this point in multer processing, req.body might not be fully populated
    // So we'll use a temporary directory first and move the file later
    console.log('📁 Using temporary upload directory initially');
    console.log('📁 req.body at destination time:', req.body);
    
    // Use temp directory initially - we'll move the file to correct location after upload
    const tempUploadDir = path.join(__dirname, '../Photos/temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempUploadDir)) {
      fs.mkdirSync(tempUploadDir, { recursive: true });
      console.log('✅ Created temp directory:', tempUploadDir);
    }
    
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate temporary filename - we'll rename it after upload when we have full req.body
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const tempFilename = `temp_${timestamp}${ext}`;
    console.log('📝 Generated temporary filename:', tempFilename);
    cb(null, tempFilename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDF/Word documents are allowed.'), false);
  }
};

// Configure multer with 5MB limit
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
    console.log('📤 Upload request received:', {
      patientId: req.body.patientId,
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

    // Get patient ID and field name from request body (now fully parsed)
    const patientId = req.body.patientId || 'temp';
    const fieldName = req.body.fieldName || 'general';
    
    console.log('📁 Moving file to patient-specific folder...');
    console.log('📁 Patient ID:', patientId);
    console.log('📁 Field Name:', fieldName);
    
    // Create patient-specific directory: server/Photos/patient Admission/{PatientId}
    const patientDir = path.join(__dirname, '../Photos/patient Admission', patientId);
    
    if (!fs.existsSync(patientDir)) {
      fs.mkdirSync(patientDir, { recursive: true });
      console.log('✅ Created patient directory:', patientDir);
    }
    
    // Generate final filename
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const finalFilename = `${fieldName}_${timestamp}${ext}`;
    
    // Final file path
    const finalFilePath = path.join(patientDir, finalFilename);
    
    // Move file from temp to patient folder
    fs.renameSync(req.file.path, finalFilePath);
    console.log('✅ File moved successfully from temp to:', finalFilePath);
    
    // Return the relative path from server root matching your existing structure
    const relativePath = path.join('Photos', 'patient Admission', patientId, finalFilename);
    
    console.log('✅ File uploaded successfully to:', relativePath);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: relativePath,
      filename: finalFilename,
      originalName: req.file.originalname,
      size: req.file.size,
      fieldName: fieldName,
      patientId: patientId
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up temp file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Cleaned up temp file:', req.file.path);
      } catch (cleanupError) {
        console.error('❌ Could not clean up temp file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// Get file URL endpoint
router.get('/file/:patientId/:filename', (req, res) => {
  try {
    const { patientId, filename } = req.params;
    const filePath = path.join(__dirname, '../Photos/patient Admission', patientId, filename);
    
    console.log('📁 Requesting file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found:', filePath);
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    console.log('✅ Sending file:', filePath);
    // Send the file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('❌ File retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'File retrieval failed'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Upload failed'
  });
});

export default router;