-- Create staff attendance table
CREATE TABLE IF NOT EXISTS staff_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(20) NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  check_in TIME DEFAULT NULL,
  check_out TIME DEFAULT NULL,
  status ENUM('Present', 'Absent', 'Late', 'Half Day') NOT NULL DEFAULT 'Present',
  working_hours VARCHAR(20) DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_staff_id (staff_id),
  INDEX idx_date (date),
  INDEX idx_staff_date (staff_id, date),
  INDEX idx_status (status),
  
  -- Unique constraint to prevent duplicate entries for same staff on same date
  UNIQUE KEY unique_staff_date (staff_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
