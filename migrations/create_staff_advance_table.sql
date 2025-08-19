-- Create staff_advance table
CREATE TABLE IF NOT EXISTS staff_advance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_date (date),
  INDEX idx_created_at (created_at)
);
