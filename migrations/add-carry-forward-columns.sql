-- Add carry forward columns to doctor_monthly_salary table
ALTER TABLE doctor_monthly_salary 
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0 AFTER year,
ADD COLUMN IF NOT EXISTS advance_amount DECIMAL(10,2) DEFAULT 0 AFTER total_paid,
ADD COLUMN IF NOT EXISTS carry_forward_from_previous DECIMAL(10,2) DEFAULT 0 AFTER advance_amount,
ADD COLUMN IF NOT EXISTS carry_forward_to_next DECIMAL(10,2) DEFAULT 0 AFTER carry_forward_from_previous,
ADD COLUMN IF NOT EXISTS net_balance DECIMAL(10,2) DEFAULT 0 AFTER carry_forward_to_next;
