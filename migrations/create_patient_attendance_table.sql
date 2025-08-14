CREATE TABLE IF NOT EXISTS patient_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Late') NOT NULL DEFAULT 'Present',
    check_in_time TIME NOT NULL,
    check_out_time TIME NULL,
    notes TEXT,
    modified_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
