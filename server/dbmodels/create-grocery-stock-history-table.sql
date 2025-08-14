CREATE TABLE IF NOT EXISTS grocery_stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  product_name VARCHAR(255),
  category VARCHAR(255),
  supplier VARCHAR(255),
  purchase_date DATE,
  stock_change INT NOT NULL,
  stock_type ENUM('used', 'added', 'adjusted') DEFAULT 'used',
  current_stock_before INT NOT NULL,
  current_stock_after INT NOT NULL,
  update_date DATE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES grocery_products(id) ON DELETE CASCADE
);
