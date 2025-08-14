const mysql = require('mysql2/promise');

async function setupPatientAttendanceTable() {
  const connection = await mysql.createConnection({
    host: 'srv1434.hstgr.io',
    user: 'u574849695_testcrm',
    password: 'TestCRM@db24',
    database: 'u574849695_testcrm'
  });

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
      )
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ Patient attendance table created successfully!');
    
    // Check if table was created
    const [rows] = await connection.execute('DESCRIBE patient_attendance');
    console.log('Table structure verified:', rows.length, 'columns');
    
  } catch (error) {
    console.error('❌ Error setting up patient attendance table:', error.message);
  } finally {
    await connection.end();
  }
}

setupPatientAttendanceTable();
