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
    const { patientId = 'temp', fieldName = 'general' } = req.body;
    
    // Create patient-specific directory structure: server/Photos/patients/{patientId}
    const uploadDir = path.join(__dirname, '../Photos/patients', patientId.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const { patientId = 'temp', fieldName = 'general' } = req.body;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${fieldName}_${timestamp}${ext}`;
    cb(null, filename);
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
    const relativePath = path.join('Photos', 'patients', req.body.patientId || 'temp', req.file.filename);
    
    console.log('✅ File uploaded successfully:', relativePath);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      fieldName: req.body.fieldName || 'general',
      patientId: req.body.patientId || 'temp'
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
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
    const filePath = path.join(__dirname, '../Photos/patients', patientId, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
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