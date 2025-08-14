// Setup script to create patient attendance table
import mysql from 'mysql2/promise';

// MySQL connection config (updated with correct credentials)
const db = await mysql.createPool({
  host: 'srv1434.hstgr.io',
  user: 'u574849695_testcrm',
  password: 'TestCRM@db24',
  database: 'u574849695_testcrm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupPatientAttendanceTable() {
  try {
    console.log('Creating patient_attendance table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS patient_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id VARCHAR(50) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent', 'Late') NOT NULL DEFAULT 'Present',
        check_in_time TIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_id (patient_id),
        INDEX idx_date (date),
        INDEX idx_patient_date (patient_id, date),
        UNIQUE KEY unique_patient_date (patient_id, date)
      );
    `;
    
    await db.query(createTableSQL);
    console.log('✅ patient_attendance table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating patient_attendance table:', error);
  } finally {
    await db.end();
  }
}

setupPatientAttendanceTable();
