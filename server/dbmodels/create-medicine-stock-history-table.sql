-- Medicine Stock History Table for tracking individual medicine stock updates
CREATE TABLE IF NOT EXISTS medicine_stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  stock_change INT NOT NULL,
  stock_type ENUM('used', 'added', 'adjusted') DEFAULT 'used',
  current_stock_before INT NOT NULL,
  current_stock_after INT NOT NULL,
  update_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES medicine_products(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_medicine_stock_history_product_id ON medicine_stock_history(product_id);
CREATE INDEX idx_medicine_stock_history_date ON medicine_stock_history(update_date);