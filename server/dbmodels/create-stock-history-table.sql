-- Stock History Table for tracking individual stock updates with product details
CREATE TABLE IF NOT EXISTS stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  purchase_date DATE,
  stock_change INT NOT NULL,
  stock_type ENUM('used', 'added', 'adjusted') DEFAULT 'used',
  current_stock_before INT NOT NULL,
  current_stock_after INT NOT NULL,
  update_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES general_products(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX idx_stock_history_date ON stock_history(update_date);
