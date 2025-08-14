-- Run this SQL on your Hostinger MySQL database to create the lead_categories table
CREATE TABLE IF NOT EXISTS lead_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('active','inactive') DEFAULT 'active',
  createdAt DATE
);
