-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active','inactive') DEFAULT 'active',
  createdAt DATE DEFAULT (CURRENT_DATE)
);

-- Insert default roles if table is empty
INSERT IGNORE INTO roles (name, description, status, createdAt) VALUES 
('Admin', 'Full system access', 'active', CURDATE()),
('Manager', 'Department management access', 'active', CURDATE()),
('User', 'Basic user access', 'active', CURDATE());
