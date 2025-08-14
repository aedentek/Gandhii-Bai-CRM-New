-- Add accounting fields to general_products table
ALTER TABLE general_products ADD COLUMN IF NOT EXISTS purchase_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE general_products ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE general_products ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE general_products ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending';
ALTER TABLE general_products ADD COLUMN IF NOT EXISTS payment_type ENUM('upi', 'cash', 'card', 'neft') DEFAULT NULL;
