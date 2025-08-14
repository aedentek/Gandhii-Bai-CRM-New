import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
});

const sql = `
CREATE TABLE IF NOT EXISTS patient_history (
  id VARCHAR(50) PRIMARY KEY,
  patient_id VARCHAR(50) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(500) NOT NULL,
  doctor VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  audio_recording LONGTEXT,
  audio_file_name VARCHAR(255),
  audio_duration INT DEFAULT 0,
  documents_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patient_id (patient_id),
  INDEX idx_date (date),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);
`;

try {
  await db.execute(sql);
  console.log('Patient history table created successfully');
} catch (error) {
  console.error('Error creating table:', error);
}

await db.end();
