-- Doctor Salary Tables Schema

-- Doctor Salary History Table - tracks all salary payments
CREATE TABLE IF NOT EXISTS doctor_salary_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(255) NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') NOT NULL DEFAULT 'Bank Transfer',
    previous_total_paid DECIMAL(10,2) DEFAULT 0,
    new_total_paid DECIMAL(10,2) NOT NULL,
    salary_month INT NOT NULL,
    salary_year INT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_date (payment_date),
    INDEX idx_month_year (salary_month, salary_year)
);

-- Doctor Monthly Salary Table - tracks monthly salary status
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

-- Add sample data for testing
-- INSERT INTO doctor_salary_history (doctor_id, payment_amount, payment_date, payment_mode, previous_total_paid, new_total_paid, salary_month, salary_year) VALUES
-- ('DOC001', 15000.00, CURDATE(), 'Bank Transfer', 0, 15000.00, MONTH(CURDATE()), YEAR(CURDATE()));

-- INSERT INTO doctor_monthly_salary (doctor_id, month, year, total_paid, payment_mode, status) VALUES  
-- ('DOC001', MONTH(CURDATE()), YEAR(CURDATE()), 15000.00, 'Bank Transfer', 'Paid');
