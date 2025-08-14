-- Remove title and category columns from patient_history table
-- These fields have been removed from the frontend form and are no longer needed

-- First, let's see if we can drop the columns (this might fail if there are constraints)
ALTER TABLE patient_history 
DROP COLUMN title,
DROP COLUMN category;

-- Also remove the index on category since we're dropping the column
-- Note: If the index doesn't exist, this will fail but that's okay
DROP INDEX idx_category ON patient_history;
