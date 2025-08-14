CREATE TABLE IF NOT EXISTS grocery_suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATE DEFAULT (CURRENT_DATE)
);
