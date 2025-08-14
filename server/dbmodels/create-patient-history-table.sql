-- Create patient_history table for storing medical records and patient documentation
CREATE TABLE IF NOT EXISTS patient_history (
  id VARCHAR(50) PRIMARY KEY,
  patient_id VARCHAR(50) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  doctor VARCHAR(255) NOT NULL,
  description TEXT,
  audio_recording LONGTEXT, -- For storing base64 encoded audio data
  audio_file_name VARCHAR(255),
  audio_duration INT DEFAULT 0, -- Duration in seconds
  documents_info JSON, -- For storing document metadata and file info
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patient_id (patient_id),
  INDEX idx_date (date),
  INDEX idx_created_at (created_at)
);
