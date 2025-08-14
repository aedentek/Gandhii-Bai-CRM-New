-- Settlement History Table for tracking individual payments with product details
CREATE TABLE IF NOT EXISTS settlement_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  purchase_date DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type ENUM('upi', 'cash', 'card', 'neft') DEFAULT 'cash',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES general_products(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_settlement_product_id ON settlement_history(product_id);
CREATE INDEX idx_settlement_date ON settlement_history(payment_date);
