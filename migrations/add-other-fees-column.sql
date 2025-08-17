-- Migration to add otherFees column to patients table
-- This column will store the sum of pickupCharge + bloodTest

USE `gandhibai_crm`;

-- Add the otherFees column
ALTER TABLE patients 
ADD COLUMN otherFees DECIMAL(10,2) DEFAULT 0 
AFTER pickupCharge;

-- Update existing records to calculate otherFees
UPDATE patients 
SET otherFees = COALESCE(pickupCharge, 0) + COALESCE(bloodTest, 0);

-- Create a trigger to automatically update otherFees when pickupCharge or bloodTest changes
DELIMITER $$

CREATE TRIGGER update_other_fees_before_insert
BEFORE INSERT ON patients
FOR EACH ROW
BEGIN
    SET NEW.otherFees = COALESCE(NEW.pickupCharge, 0) + COALESCE(NEW.bloodTest, 0);
END$$

CREATE TRIGGER update_other_fees_before_update
BEFORE UPDATE ON patients
FOR EACH ROW
BEGIN
    SET NEW.otherFees = COALESCE(NEW.pickupCharge, 0) + COALESCE(NEW.bloodTest, 0);
END$$

DELIMITER ;

-- Verify the migration
SELECT 
    id, 
    name, 
    fees, 
    bloodTest, 
    pickupCharge, 
    otherFees,
    (bloodTest + pickupCharge) AS calculated_other_fees
FROM patients 
LIMIT 5;
