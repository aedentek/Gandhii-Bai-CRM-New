-- Add carry forward functionality to doctor_monthly_salary table

-- First, let's make sure the table exists with the basic structure
CREATE TABLE IF NOT EXISTS doctor_monthly_salary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(255) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') DEFAULT 'Bank Transfer',
    status ENUM('Pending', 'Partial', 'Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_doctor_month_year (doctor_id, month, year),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_month_year (month, year),
    INDEX idx_status (status)
);

-- Now add the carry forward columns if they don't exist
ALTER TABLE doctor_monthly_salary 
ADD COLUMN IF NOT EXISTS carry_forward_from_previous DECIMAL(10,2) DEFAULT 0 COMMENT 'Amount carried forward from previous month',
ADD COLUMN IF NOT EXISTS carry_forward_to_next DECIMAL(10,2) DEFAULT 0 COMMENT 'Amount to carry forward to next month',
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0 COMMENT 'Base monthly salary for this doctor',
ADD COLUMN IF NOT EXISTS total_due DECIMAL(10,2) DEFAULT 0 COMMENT 'Total amount due (base_salary + carry_forward_from_previous)',
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0 COMMENT 'Remaining balance (total_due - total_paid)';

-- Add indexes for the new columns
ALTER TABLE doctor_monthly_salary 
ADD INDEX IF NOT EXISTS idx_carry_forward_to_next (carry_forward_to_next),
ADD INDEX IF NOT EXISTS idx_balance (balance);
