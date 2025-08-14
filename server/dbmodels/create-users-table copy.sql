-- Create users table for user management
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  createdAt DATE,
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_status (status)
);

-- Insert some sample users for testing
INSERT INTO users (username, role, password, status, createdAt) VALUES 
('admin', 'Admin', 'admin123', 'Active', CURDATE()),
('manager1', 'Manager', 'manager123', 'Active', CURDATE()),
('user1', 'User', 'user123', 'Active', CURDATE());
