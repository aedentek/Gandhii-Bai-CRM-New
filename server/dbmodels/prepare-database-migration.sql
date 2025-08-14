-- Update existing patient_history records to set default values before dropping columns
-- This ensures data consistency when the columns are removed

-- First, let's update any NULL values in title and category columns
UPDATE patient_history 
SET title = 'Medical Record' 
WHERE title IS NULL OR title = '';

UPDATE patient_history 
SET category = 'General' 
WHERE category IS NULL OR category = '';

-- Note: After running this, you can then execute remove-title-category-columns.sql
-- to actually drop the columns from the table structure.
