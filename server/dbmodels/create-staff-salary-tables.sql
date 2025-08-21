-- Staff Salary Management Tables - Mirroring Doctor Salary System
-- Author: CRM System
-- Date: 2025-08-22

-- ============================================
-- 1. Staff Monthly Salary Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS staff_monthly_salary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(20) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    base_salary DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    advance_amount DECIMAL(10,2) DEFAULT 0,
    carry_forward_from_previous DECIMAL(10,2) DEFAULT 0,
    carry_forward_to_next DECIMAL(10,2) DEFAULT 0,
    net_balance DECIMAL(10,2) DEFAULT 0,
    status ENUM('Pending', 'Paid', 'Overpaid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_staff_id (staff_id),
    INDEX idx_month_year (month, year),
    INDEX idx_staff_month_year (staff_id, month, year),
    INDEX idx_status (status),
    
    -- Unique constraint to prevent duplicate records
    UNIQUE KEY unique_staff_month_year (staff_id, month, year),
    
    -- Foreign key reference (if needed)
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Staff Salary Settlements Table (Payment History)
-- ============================================
CREATE TABLE IF NOT EXISTS staff_salary_settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(20) NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') DEFAULT 'Bank Transfer',
    type ENUM('salary', 'advance', 'bonus', 'incentive', 'allowance') DEFAULT 'salary',
    month INT NOT NULL,
    year INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_staff_id (staff_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_month_year (month, year),
    INDEX idx_staff_month_year (staff_id, month, year),
    INDEX idx_type (type),
    INDEX idx_payment_mode (payment_mode),
    
    -- Foreign key reference
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Staff Salary History Table (Detailed Records)
-- ============================================
CREATE TABLE IF NOT EXISTS staff_salary_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(20) NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    salary_month INT NOT NULL,
    salary_year INT NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') DEFAULT 'Bank Transfer',
    type ENUM('salary', 'advance', 'bonus', 'incentive', 'allowance') DEFAULT 'salary',
    advance_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_staff_id (staff_id),
    INDEX idx_salary_month_year (salary_month, salary_year),
    INDEX idx_staff_salary_period (staff_id, salary_month, salary_year),
    INDEX idx_payment_date (payment_date),
    INDEX idx_type (type),
    
    -- Foreign key reference
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Add Sample Data for Testing
-- ============================================

-- Insert sample monthly salary records (Current month - August 2025)
INSERT IGNORE INTO staff_monthly_salary (staff_id, month, year, base_salary, total_paid, advance_amount, carry_forward_from_previous, carry_forward_to_next, net_balance, status) VALUES
('STF001', 8, 2025, 75000.00, 0, 0, 0, 75000.00, 'Pending'),
('STF002', 8, 2025, 45000.00, 0, 0, 0, 45000.00, 'Pending'),
('STF003', 8, 2025, 55000.00, 0, 0, 0, 55000.00, 'Pending'),
('STF004', 8, 2025, 45000.00, 0, 0, 0, 45000.00, 'Pending');

-- Insert sample payment settlement records
INSERT IGNORE INTO staff_salary_settlements (staff_id, staff_name, payment_date, payment_amount, payment_mode, type, month, year, notes) VALUES
('STF001', 'John Smith', '2025-08-15', 25000.00, 'Bank Transfer', 'salary', 8, 2025, 'Partial salary payment for August 2025'),
('STF002', 'Sarah Johnson', '2025-08-10', 15000.00, 'UPI', 'salary', 8, 2025, 'Advance payment for August 2025'),
('STF003', 'Michael Brown', '2025-08-12', 30000.00, 'Bank Transfer', 'salary', 8, 2025, 'Partial payment for August 2025');

-- Insert sample salary history records
INSERT IGNORE INTO staff_salary_history (staff_id, staff_name, salary_month, salary_year, base_salary, payment_amount, payment_date, payment_mode, type, advance_amount, balance_amount, notes) VALUES
('STF001', 'John Smith', 8, 2025, 75000.00, 25000.00, '2025-08-15', 'Bank Transfer', 'salary', 2000.00, 52000.00, 'Partial payment with advance deduction'),
('STF002', 'Sarah Johnson', 8, 2025, 45000.00, 15000.00, '2025-08-10', 'UPI', 'salary', 1500.00, 28500.00, 'Early payment for August'),
('STF003', 'Michael Brown', 8, 2025, 55000.00, 30000.00, '2025-08-12', 'Bank Transfer', 'salary', 3000.00, 22000.00, 'Mid-month payment');

-- ============================================
-- 5. Useful Queries for Verification
-- ============================================

-- View all staff monthly salary records
-- SELECT * FROM staff_monthly_salary ORDER BY staff_id, year DESC, month DESC;

-- View all payment settlements
-- SELECT * FROM staff_salary_settlements ORDER BY payment_date DESC;

-- View staff salary history
-- SELECT * FROM staff_salary_history ORDER BY staff_id, salary_year DESC, salary_month DESC;

-- Get current month balance for all staff
-- SELECT 
--     sms.*,
--     s.name,
--     s.role,
--     s.department
-- FROM staff_monthly_salary sms
-- LEFT JOIN staff s ON sms.staff_id = s.id
-- WHERE sms.month = 8 AND sms.year = 2025
-- ORDER BY sms.net_balance DESC;

-- ============================================
-- 6. Setup Complete Message
-- ============================================
SELECT 'Staff Salary Management Tables Created Successfully!' as Status;
