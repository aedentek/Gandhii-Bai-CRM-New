-- Create doctor_attendance table
CREATE TABLE IF NOT EXISTS doctor_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(20) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    check_in TIME NULL,
    check_out TIME NULL,
    status ENUM('Present', 'Absent', 'Late', 'Half Day') NOT NULL DEFAULT 'Present',
    working_hours VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_doctor_date (doctor_id, date),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_date (date),
    INDEX idx_status (status)
);
