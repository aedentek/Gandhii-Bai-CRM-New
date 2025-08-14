-- Run this SQL in your MySQL to create the roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active','inactive') DEFAULT 'active',
  createdAt DATE
);
