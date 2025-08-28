-- Enhanced Patient Payment Management Schema
-- This schema supports test-report-amount, carry forward, auto-save functionality

-- Create patient payment records table (monthly records)
DROP TABLE IF EXISTS patient_payment_records;
CREATE TABLE patient_payment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    total_fees DECIMAL(10,2) DEFAULT 0,
    test_report_amount DECIMAL(10,2) DEFAULT 0,
    monthly_paid DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    carry_forward DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    payment_status ENUM('Paid', 'Pending', 'Partial') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_month_year (patient_id, month, year),
    INDEX idx_payment_status (payment_status),
    INDEX idx_month_year (month, year),
    UNIQUE KEY unique_patient_month_year (patient_id, month, year)
);

-- Create patient payment history table (individual transactions)
DROP TABLE IF EXISTS patient_payment_history;
CREATE TABLE patient_payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    type ENUM('fees', 'test_report', 'advance', 'other') DEFAULT 'fees',
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_type (type)
);

-- Create carry forward tracking table
DROP TABLE IF EXISTS patient_carry_forward;
CREATE TABLE patient_carry_forward (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    from_month INT NOT NULL,
    from_year INT NOT NULL,
    to_month INT NOT NULL,
    to_year INT NOT NULL,
    carry_forward_amount DECIMAL(10,2) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_to_month_year (to_month, to_year)
);

-- Insert sample data to match the existing patients
INSERT INTO patient_payment_records (
    patient_id, 
    month, 
    year, 
    total_fees, 
    test_report_amount,
    total_paid, 
    carry_forward, 
    balance
) 
SELECT 
    p.id,
    MONTH(CURRENT_DATE) as month,
    YEAR(CURRENT_DATE) as year,
    COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) as total_fees,
    COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) as test_report_amount,
    COALESCE(p.payAmount, 0) as total_paid,
    0 as carry_forward,
    GREATEST(0, COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) - COALESCE(p.payAmount, 0)) as balance
FROM patients p
WHERE p.id IS NOT NULL;

-- Update payment status based on balance
UPDATE patient_payment_records 
SET payment_status = CASE 
    WHEN balance <= 0 THEN 'Paid'
    WHEN total_paid > 0 AND balance > 0 THEN 'Partial'
    ELSE 'Pending'
END;

-- Create trigger for automatic carry forward at month end
DELIMITER //

CREATE TRIGGER patient_payment_carry_forward_trigger
    AFTER INSERT ON patient_payment_records
    FOR EACH ROW
BEGIN
    -- If it's the last day of the month and there's a balance, prepare carry forward
    IF NEW.balance > 0 AND DAYOFMONTH(CURRENT_DATE) >= 28 THEN
        SET @next_month = IF(NEW.month = 12, 1, NEW.month + 1);
        SET @next_year = IF(NEW.month = 12, NEW.year + 1, NEW.year);
        
        -- Insert carry forward record
        INSERT INTO patient_carry_forward (
            patient_id, 
            from_month, 
            from_year, 
            to_month, 
            to_year, 
            carry_forward_amount
        ) VALUES (
            NEW.patient_id,
            NEW.month,
            NEW.year,
            @next_month,
            @next_year,
            NEW.balance
        ) ON DUPLICATE KEY UPDATE 
            carry_forward_amount = NEW.balance,
            processed_at = CURRENT_TIMESTAMP;
    END IF;
END//

DELIMITER ;

-- Create view for easy patient payment overview
CREATE OR REPLACE VIEW patient_payment_overview AS
SELECT 
    p.id as patient_id,
    p.name,
    p.email,
    p.phone,
    p.registrationId as registration_id,
    p.admissionDate as admission_date,
    p.photo,
    COALESCE(ppr.total_fees, p.bloodTest + p.fees + p.pickupCharge, 0) as test_report_amount,
    COALESCE(ppr.total_paid, p.payAmount, 0) as total_paid,
    COALESCE(ppr.carry_forward, 0) as carry_forward,
    COALESCE(ppr.balance, GREATEST(0, COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) - COALESCE(p.payAmount, 0))) as balance,
    COALESCE(ppr.payment_status, 
        CASE 
            WHEN COALESCE(ppr.balance, GREATEST(0, COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) - COALESCE(p.payAmount, 0))) <= 0 THEN 'Paid'
            WHEN COALESCE(ppr.total_paid, p.payAmount, 0) > 0 THEN 'Partial'
            ELSE 'Pending'
        END
    ) as status,
    COALESCE(p.paymentType, 'Cash') as payment_mode,
    ppr.month,
    ppr.year,
    ppr.updated_at as last_updated
FROM patients p
LEFT JOIN patient_payment_records ppr ON p.id = ppr.patient_id 
    AND ppr.month = MONTH(CURRENT_DATE) 
    AND ppr.year = YEAR(CURRENT_DATE);

-- Create stored procedure for monthly auto-save
DELIMITER //

CREATE PROCEDURE SaveMonthlyPatientRecords(IN target_month INT, IN target_year INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE patient_id_var VARCHAR(50);
    DECLARE patient_cursor CURSOR FOR 
        SELECT DISTINCT id FROM patients WHERE id IS NOT NULL;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE records_processed INT DEFAULT 0;
    DECLARE carry_forward_updates INT DEFAULT 0;
    
    START TRANSACTION;
    
    OPEN patient_cursor;
    
    patient_loop: LOOP
        FETCH patient_cursor INTO patient_id_var;
        IF done THEN
            LEAVE patient_loop;
        END IF;
        
        -- Insert or update patient payment record for the target month
        INSERT INTO patient_payment_records (
            patient_id, 
            month, 
            year, 
            total_fees, 
            test_report_amount,
            total_paid, 
            carry_forward, 
            balance
        )
        SELECT 
            p.id,
            target_month,
            target_year,
            COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0),
            COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0),
            COALESCE(
                (SELECT SUM(payment_amount) 
                 FROM patient_payment_history 
                 WHERE patient_id = p.id 
                   AND MONTH(payment_date) = target_month 
                   AND YEAR(payment_date) = target_year), 
                0
            ),
            COALESCE(
                (SELECT SUM(carry_forward_amount) 
                 FROM patient_carry_forward 
                 WHERE patient_id = p.id 
                   AND to_month = target_month 
                   AND to_year = target_year), 
                0
            ),
            GREATEST(0, 
                COALESCE(p.bloodTest + p.fees + p.pickupCharge, 0) + 
                COALESCE(
                    (SELECT SUM(carry_forward_amount) 
                     FROM patient_carry_forward 
                     WHERE patient_id = p.id 
                       AND to_month = target_month 
                       AND to_year = target_year), 
                    0
                ) - 
                COALESCE(
                    (SELECT SUM(payment_amount) 
                     FROM patient_payment_history 
                     WHERE patient_id = p.id 
                       AND MONTH(payment_date) = target_month 
                       AND YEAR(payment_date) = target_year), 
                    0
                )
            )
        FROM patients p 
        WHERE p.id = patient_id_var
        ON DUPLICATE KEY UPDATE
            total_fees = VALUES(total_fees),
            test_report_amount = VALUES(test_report_amount),
            total_paid = VALUES(total_paid),
            carry_forward = VALUES(carry_forward),
            balance = VALUES(balance),
            updated_at = CURRENT_TIMESTAMP;
        
        SET records_processed = records_processed + 1;
        
    END LOOP;
    
    CLOSE patient_cursor;
    
    -- Process carry forwards for patients with balances
    INSERT INTO patient_carry_forward (
        patient_id, 
        from_month, 
        from_year, 
        to_month, 
        to_year, 
        carry_forward_amount
    )
    SELECT 
        patient_id,
        target_month,
        target_year,
        IF(target_month = 12, 1, target_month + 1) as next_month,
        IF(target_month = 12, target_year + 1, target_year) as next_year,
        balance
    FROM patient_payment_records 
    WHERE month = target_month 
      AND year = target_year 
      AND balance > 0
    ON DUPLICATE KEY UPDATE 
        carry_forward_amount = VALUES(carry_forward_amount),
        processed_at = CURRENT_TIMESTAMP;
    
    SET carry_forward_updates = ROW_COUNT();
    
    COMMIT;
    
    SELECT records_processed, carry_forward_updates;
    
END//

DELIMITER ;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON patient_payment_records TO 'healthcare_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON patient_payment_history TO 'healthcare_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON patient_carry_forward TO 'healthcare_user'@'%';
GRANT SELECT ON patient_payment_overview TO 'healthcare_user'@'%';
GRANT EXECUTE ON PROCEDURE SaveMonthlyPatientRecords TO 'healthcare_user'@'%';
