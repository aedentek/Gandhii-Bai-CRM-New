const mysql = require('mysql2/promise');

async function testAttendanceTable() {
  const connection = await mysql.createConnection({
    host: 'srv1434.hstgr.io',
    user: 'u574849695_testcrm',
    password: 'TestCRM@db24',
    database: 'u574849695_testcrm'
  });

  try {
    console.log('Checking for attendance tables...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "%attendance%"');
    console.log('Attendance tables found:', tables);

    if (tables.length > 0) {
      console.log('\nChecking patient_attendance table structure...');
      const [structure] = await connection.execute('DESCRIBE patient_attendance');
      console.log('Table structure:', structure);

      console.log('\nChecking existing records...');
      const [records] = await connection.execute('SELECT COUNT(*) as count FROM patient_attendance');
      console.log('Records in table:', records[0].count);
    } else {
      console.log('No attendance tables found. Creating patient_attendance table...');
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
      console.log('Patient attendance table created successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testAttendanceTable();
