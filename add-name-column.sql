-- Add doctor_name column to doctor_salary_settlements table
ALTER TABLE doctor_salary_settlements 
ADD COLUMN doctor_name VARCHAR(255) AFTER doctor_id;

-- Show the updated table structure
DESCRIBE doctor_salary_settlements;
