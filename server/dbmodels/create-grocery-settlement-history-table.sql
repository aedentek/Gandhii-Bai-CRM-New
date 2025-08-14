CREATE TABLE IF NOT EXISTS grocery_settlement_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  product_name VARCHAR(255),
  category VARCHAR(255),
  supplier VARCHAR(255),
  purchase_date DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type ENUM('upi', 'cash', 'card', 'neft') DEFAULT 'cash',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES grocery_products(id) ON DELETE CASCADE
);
