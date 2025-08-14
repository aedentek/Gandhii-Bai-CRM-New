-- Run this SQL on your Hostinger MySQL database to create a sample leads table
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date VARCHAR(20),
  name VARCHAR(100) NOT NULL,
  contactNumber VARCHAR(20) NOT NULL,
  reminderDate VARCHAR(20),
  category VARCHAR(100),
  status ENUM('Active','Inactive') DEFAULT 'Active',
  description TEXT
);
