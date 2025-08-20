-- SQL to add doctor_name column to doctor_salary_settlements table

-- Step 1: Add the doctor_name column
ALTER TABLE doctor_salary_settlements 
ADD COLUMN doctor_name VARCHAR(255) AFTER doctor_id;

-- Step 2: Update existing records with doctor names (if any exist)
UPDATE doctor_salary_settlements dss 
JOIN doctors d ON dss.doctor_id = d.id 
SET dss.doctor_name = d.name 
WHERE dss.doctor_name IS NULL OR dss.doctor_name = '';

-- Step 3: Show the updated table structure
DESCRIBE doctor_salary_settlements;
