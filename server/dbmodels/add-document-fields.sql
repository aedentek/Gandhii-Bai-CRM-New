-- Add document fields to patients table
ALTER TABLE patients 
ADD COLUMN patientAadhar TEXT AFTER photo,
ADD COLUMN patientPan TEXT AFTER patientAadhar,
ADD COLUMN attenderAadhar TEXT AFTER patientPan,
ADD COLUMN attenderPan TEXT AFTER attenderAadhar;
