-- Create a comprehensive patient payments table that matches our data structure
DROP TABLE IF EXISTS patient_payments;

CREATE TABLE patient_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    monthly_fees DECIMAL(10,2) DEFAULT 0,
    other_fees DECIMAL(10,2) DEFAULT 0,
    carry_forward DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    total_balance DECIMAL(10,2) DEFAULT 0,
    payment_status ENUM('Paid', 'Pending', 'Partial') DEFAULT 'Pending',
    payment_type VARCHAR(50) DEFAULT 'Cash',
    payment_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_id (patient_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_date (payment_date)
);
