-- Add GP ID field to general_products table
ALTER TABLE general_products 
ADD COLUMN gp_id VARCHAR(10) UNIQUE AFTER id;

-- Create index for GP ID
CREATE INDEX idx_general_products_gp_id ON general_products(gp_id);
