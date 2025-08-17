const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPatientHistoryTable() {
  try {
    console.log('🔍 Connecting to database...');
    const db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('✅ Connected to database');

    // Check if table exists
    console.log('🔍 Checking if patient_history table exists...');
    const [tables] = await db.query("SHOW TABLES LIKE 'patient_history'");
    
    if (tables.length === 0) {
      console.log('❌ patient_history table does not exist!');
      
      console.log('🔧 Creating patient_history table...');
      await db.query(`
        CREATE TABLE patient_history (
          id VARCHAR(255) PRIMARY KEY,
          patient_id VARCHAR(50) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          title VARCHAR(255),
          doctor VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          description TEXT,
          audio_recording TEXT,
          audio_file_name VARCHAR(255),
          audio_duration INT DEFAULT 0,
          documents_info JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ patient_history table created successfully!');
    } else {
      console.log('✅ patient_history table exists');
      
      // Show table structure
      console.log('🔍 Table structure:');
      const [columns] = await db.query("DESCRIBE patient_history");
      console.table(columns);
      
      // Show existing records
      const [records] = await db.query("SELECT COUNT(*) as count FROM patient_history");
      console.log('📊 Existing records:', records[0].count);
    }

    await db.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

checkPatientHistoryTable();
