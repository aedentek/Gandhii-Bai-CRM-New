CREATE TABLE IF NOT EXISTS grocery_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATE DEFAULT (CURRENT_DATE)
);