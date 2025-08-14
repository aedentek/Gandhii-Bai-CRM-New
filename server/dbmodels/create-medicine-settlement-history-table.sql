CREATE TABLE IF NOT EXISTS medicine_settlement_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  product_name VARCHAR(255),
  category VARCHAR(255),
  supplier VARCHAR(255),
  settlement_amount DECIMAL(10,2) NOT NULL,
  settlement_date DATE NOT NULL,
  payment_type ENUM('upi', 'cash', 'card', 'neft') DEFAULT 'cash',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES medicine_products(id) ON DELETE CASCADE
);
