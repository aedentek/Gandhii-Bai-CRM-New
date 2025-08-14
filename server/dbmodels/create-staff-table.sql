-- Create staff table for CRM system
CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(100),
  department VARCHAR(255),
  join_date DATE,
  salary DECIMAL(10,2),
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  photo TEXT,
  documents JSON,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  deleted_by VARCHAR(255) NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_staff_deleted_at ON staff(deleted_at);
