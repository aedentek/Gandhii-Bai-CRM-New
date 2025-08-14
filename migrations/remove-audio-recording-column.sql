-- Migration: Remove audio_recording column and ensure audio_file_name exists
ALTER TABLE patient_call_records 
DROP COLUMN IF EXISTS audio_recording,
ADD COLUMN IF NOT EXISTS audio_file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS audio_duration INT;
