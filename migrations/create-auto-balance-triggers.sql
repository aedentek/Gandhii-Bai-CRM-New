-- Auto-update patient balance trigger
-- This trigger automatically updates the patient's balance whenever a payment is added/updated/deleted

-- First, let's create a function to calculate total paid amount for a patient
DELIMITER $$

-- Trigger to update patient balance when a payment is INSERTED
DROP TRIGGER IF EXISTS update_patient_balance_after_payment_insert$$
CREATE TRIGGER update_patient_balance_after_payment_insert
AFTER INSERT ON patient_payments
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2) DEFAULT 0;
    DECLARE total_fees DECIMAL(10,2) DEFAULT 0;
    DECLARE new_balance DECIMAL(10,2) DEFAULT 0;
    
    -- Calculate total paid amount for this patient from all payment records
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM patient_payments 
    WHERE patientId = NEW.patientId;
    
    -- Get patient's total fees (monthly fees + other fees)
    SELECT COALESCE(fees, 0) + COALESCE(otherFees, 0) INTO total_fees
    FROM patients 
    WHERE id = NEW.patientId;
    
    -- Calculate new balance
    SET new_balance = GREATEST(0, total_fees - total_paid);
    
    -- Update patient record
    UPDATE patients 
    SET 
        payAmount = total_paid,
        balance = new_balance,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.patientId;
    
    -- Log the update (optional - for debugging)
    INSERT INTO system_logs (action, table_name, record_id, details, created_at) 
    VALUES (
        'AUTO_BALANCE_UPDATE', 
        'patients', 
        NEW.patientId, 
        CONCAT('Payment added: ₹', NEW.amount, ' | New balance: ₹', new_balance),
        NOW()
    ) ON DUPLICATE KEY UPDATE created_at = NOW();
    
END$$

-- Trigger to update patient balance when a payment is UPDATED
DROP TRIGGER IF EXISTS update_patient_balance_after_payment_update$$
CREATE TRIGGER update_patient_balance_after_payment_update
AFTER UPDATE ON patient_payments
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2) DEFAULT 0;
    DECLARE total_fees DECIMAL(10,2) DEFAULT 0;
    DECLARE new_balance DECIMAL(10,2) DEFAULT 0;
    
    -- Only proceed if the payment amount changed
    IF OLD.amount != NEW.amount OR OLD.patientId != NEW.patientId THEN
        
        -- Calculate total paid amount for this patient
        SELECT COALESCE(SUM(amount), 0) INTO total_paid
        FROM patient_payments 
        WHERE patientId = NEW.patientId;
        
        -- Get patient's total fees
        SELECT COALESCE(fees, 0) + COALESCE(otherFees, 0) INTO total_fees
        FROM patients 
        WHERE id = NEW.patientId;
        
        -- Calculate new balance
        SET new_balance = GREATEST(0, total_fees - total_paid);
        
        -- Update patient record
        UPDATE patients 
        SET 
            payAmount = total_paid,
            balance = new_balance,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.patientId;
        
        -- If patient ID changed, also update the old patient
        IF OLD.patientId != NEW.patientId THEN
            SELECT COALESCE(SUM(amount), 0) INTO total_paid
            FROM patient_payments 
            WHERE patientId = OLD.patientId;
            
            SELECT COALESCE(fees, 0) + COALESCE(otherFees, 0) INTO total_fees
            FROM patients 
            WHERE id = OLD.patientId;
            
            SET new_balance = GREATEST(0, total_fees - total_paid);
            
            UPDATE patients 
            SET 
                payAmount = total_paid,
                balance = new_balance,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.patientId;
        END IF;
        
    END IF;
    
END$$

-- Trigger to update patient balance when a payment is DELETED
DROP TRIGGER IF EXISTS update_patient_balance_after_payment_delete$$
CREATE TRIGGER update_patient_balance_after_payment_delete
AFTER DELETE ON patient_payments
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2) DEFAULT 0;
    DECLARE total_fees DECIMAL(10,2) DEFAULT 0;
    DECLARE new_balance DECIMAL(10,2) DEFAULT 0;
    
    -- Calculate total paid amount for this patient
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM patient_payments 
    WHERE patientId = OLD.patientId;
    
    -- Get patient's total fees
    SELECT COALESCE(fees, 0) + COALESCE(otherFees, 0) INTO total_fees
    FROM patients 
    WHERE id = OLD.patientId;
    
    -- Calculate new balance
    SET new_balance = GREATEST(0, total_fees - total_paid);
    
    -- Update patient record
    UPDATE patients 
    SET 
        payAmount = total_paid,
        balance = new_balance,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.patientId;
    
END$$

-- Trigger to update patient balance when patient fees are changed
DROP TRIGGER IF EXISTS update_patient_balance_after_fees_update$$
CREATE TRIGGER update_patient_balance_after_fees_update
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2) DEFAULT 0;
    DECLARE total_fees DECIMAL(10,2) DEFAULT 0;
    DECLARE new_balance DECIMAL(10,2) DEFAULT 0;
    
    -- Only proceed if fees or otherFees changed
    IF OLD.fees != NEW.fees OR OLD.otherFees != NEW.otherFees THEN
        
        -- Calculate total paid amount for this patient
        SELECT COALESCE(SUM(amount), 0) INTO total_paid
        FROM patient_payments 
        WHERE patientId = NEW.id;
        
        -- Get patient's new total fees
        SET total_fees = COALESCE(NEW.fees, 0) + COALESCE(NEW.otherFees, 0);
        
        -- Calculate new balance
        SET new_balance = GREATEST(0, total_fees - total_paid);
        
        -- Update patient record (only if balance changed)
        IF OLD.balance != new_balance OR OLD.payAmount != total_paid THEN
            UPDATE patients 
            SET 
                payAmount = total_paid,
                balance = new_balance,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
        END IF;
        
    END IF;
    
END$$

DELIMITER ;

-- Optional: Create a system_logs table for tracking automatic updates
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_action_record (action, table_name, record_id)
);

-- Test the triggers work by viewing current patient data
SELECT 
    id,
    name,
    fees,
    otherFees,
    (fees + otherFees) as total_fees,
    payAmount,
    balance,
    (fees + otherFees - payAmount) as calculated_balance
FROM patients 
WHERE id IN (SELECT DISTINCT patientId FROM patient_payments LIMIT 5);
