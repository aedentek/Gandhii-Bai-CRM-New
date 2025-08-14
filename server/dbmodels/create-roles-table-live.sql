-- Run this SQL in your live database to create the roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active','inactive') DEFAULT 'active',
  createdAt DATE
);

-- Insert some sample roles for testing
INSERT INTO roles (name, description, status, createdAt) VALUES 
('Admin', 'Full system access', 'active', CURDATE()),
('Manager', 'Department management access', 'active', CURDATE()),
('User', 'Basic user access', 'active', CURDATE());
