import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
import multer from 'multer';
import path  from 'path';
import fs  from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router()


// Send OTP for password reset
router.post('/send-otp', async (req, res) => {
  console.log('✅ Send OTP requested:', req.body);
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Check if user exists in management_users database
    const [rows] = await db.execute(
      'SELECT * FROM management_users WHERE username = ? AND user_status = ?', 
      [email, 'Active']
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }
    
    const user = rows[0];
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (5 minutes)
    const otpData = {
      otp,
      email,
      userId: user.id,
      userRole: user.user_role,
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes from now
    };
    
    otpStore.set(email, otpData);
    
    // Send OTP to aedentek@gmail.com
    const emailResult = await sendOTPEmail('aedentek@gmail.com', otp, email);
    
    if (emailResult.success) {
      console.log(`✅ OTP sent successfully to aedentek@gmail.com for user: ${email}`);
      
      // Auto-cleanup expired OTP after 5 minutes
      setTimeout(() => {
        otpStore.delete(email);
        console.log(`🗑️ OTP expired and removed for: ${email}`);
      }, 5 * 60 * 1000);
      
      res.json({ 
        message: 'OTP sent successfully',
        sentTo: 'aedentek@gmail.com',
        expiresIn: 300 // 5 minutes in seconds
      });
    } else {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      res.status(500).json({ 
        error: 'Failed to send OTP email',
        details: emailResult.error 
      });
    }
    
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  console.log('✅ Verify OTP requested:', req.body);
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }
  
  const otpData = otpStore.get(email);
  
  if (!otpData) {
    return res.status(404).json({ error: 'No OTP found for this email' });
  }
  
  if (Date.now() > otpData.expires) {
    otpStore.delete(email);
    return res.status(410).json({ error: 'OTP has expired' });
  }
  
  if (otpData.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  console.log('✅ OTP verified successfully for:', email);
  res.json({ 
    message: 'OTP verified successfully',
    userId: otpData.userId,
    userRole: otpData.userRole
  });
});
// ================================
// BACKUP ENDPOINT
// ================================
router.post('/backup-database', async (req, res) => {
  try {
    // Simple backup simulation - in production, implement proper backup
    res.json({ message: 'Database backup initiated', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Error creating backup:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// HEALTH CHECK
// ================================
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Unified CRM server is running', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.get('/settings', async (req, res) => {
  console.log('🔍 All settings requested');
  try {
    const [rows] = await db.execute('SELECT * FROM app_settings ORDER BY setting_key');
    console.log('✅ Settings fetched successfully:', rows.length, 'settings');
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching settings:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      details: error.message 
    });
  }
});


router.get('/settings/:key', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM app_settings WHERE setting_key = ?', [req.params.key]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ key: rows[0].setting_key, value: rows[0].setting_value });
  } catch (err) {
    console.error('Error fetching setting:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const [result] = await db.execute(
      'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [req.params.key, value]
    );
    res.json({ key: req.params.key, value: value, message: 'Setting updated successfully' });
  } catch (err) {
    console.error('Error updating setting:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    const [result] = await db.execute(
      'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [key, value]
    );
    res.json({ key, value, message: 'Setting created/updated successfully' });
  } catch (err) {
    console.error('Error creating setting:', err);
    res.status(500).json({ error: err.message });
  }
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads', 'patients');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'new_file_' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/upload-settings-file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
      message: 'Settings file uploaded successfully', 
      filename: req.file.filename,
      filePath: req.file.path,
      url: `/uploads/patients/${req.file.filename}`
    });
  } catch (err) {
    console.error('Error uploading settings file:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload-medical-history-file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
      message: 'Medical history file uploaded successfully', 
      filename: req.file.filename,
      filePath: req.file.path,
      url: `/uploads/patients/${req.file.filename}`
    });
  } catch (err) {
    console.error('Error uploading medical history file:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delete-patient-file', async (req, res) => {
  try {
    const { filename } = req.body;
    const filePath = path.join(__dirname, 'uploads', 'patients', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: err.message });
  }
});


export default router;