DROP TABLE IF EXISTS patient_attendance;

CREATE TABLE patient_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(10) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Late') NOT NULL DEFAULT 'Present',
    check_in_time TIME NOT NULL,
    check_out_time TIME NULL,
    notes TEXT NULL,
    modified_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_date (patient_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
