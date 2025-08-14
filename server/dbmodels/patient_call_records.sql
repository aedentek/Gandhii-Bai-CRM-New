CREATE TABLE patient_call_records (
    id VARCHAR(255) PRIMARY KEY,
    patient_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    audio_recording LONGTEXT,
    audio_file_name VARCHAR(255),
    audio_duration INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
