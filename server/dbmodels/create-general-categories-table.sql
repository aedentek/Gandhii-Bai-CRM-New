CREATE TABLE IF NOT EXISTS general_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATE DEFAULT (CURRENT_DATE)
);
