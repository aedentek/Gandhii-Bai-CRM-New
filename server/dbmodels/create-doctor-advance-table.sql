-- Doctor Advance Table Schema
CREATE TABLE IF NOT EXISTS doctor_advance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_date (date)
);

-- Add some sample data for testing
-- INSERT INTO doctor_advance (doctor_id, doctor_name, date, amount, reason) VALUES
-- ('DOC001', 'Dr. John Smith', '2024-01-15', 5000.00, 'Medical conference expenses'),
-- ('DOC002', 'Dr. Sarah Johnson', '2024-01-20', 3000.00, 'Equipment purchase advance');
