-- Fix date fields to allow NULL values and remove 0000-00-00 entries
-- This will resolve the date parsing issues in the frontend

-- First, update all 0000-00-00 dates to NULL
UPDATE patients 
SET admissionDate = NULL 
WHERE admissionDate = '0000-00-00' OR admissionDate = '';

UPDATE patients 
SET dateOfBirth = NULL 
WHERE dateOfBirth = '0000-00-00' OR dateOfBirth = '';

-- Modify the table structure to explicitly allow NULL for date fields
ALTER TABLE patients 
MODIFY COLUMN admissionDate DATE NULL,
MODIFY COLUMN dateOfBirth DATE NULL;

-- Add a check to ensure future dates are not 0000-00-00
-- Note: This creates a constraint to prevent invalid dates
ALTER TABLE patients 
ADD CONSTRAINT chk_admission_date 
CHECK (admissionDate IS NULL OR admissionDate > '1900-01-01');

ALTER TABLE patients 
ADD CONSTRAINT chk_birth_date 
CHECK (dateOfBirth IS NULL OR dateOfBirth > '1900-01-01');

-- Display the fixed data
SELECT id, patient_id, name, admissionDate, dateOfBirth 
FROM patients 
ORDER BY id LIMIT 10;
