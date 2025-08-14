CREATE TABLE IF NOT EXISTS general_suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATE DEFAULT (CURRENT_DATE)
);
