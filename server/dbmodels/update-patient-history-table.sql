-- Update patient_history table to support server-side file storage
-- This script adds new columns for file paths and keeps legacy base64 columns for backward compatibility

-- First, let's see the current structure
DESCRIBE patient_history;

-- Add new columns for server-side file storage
ALTER TABLE patient_history 
ADD COLUMN audio_file_path VARCHAR(500) NULL COMMENT 'Server file path for audio recording',
ADD COLUMN multiple_audio_files TEXT NULL COMMENT 'JSON array of multiple audio file paths',
ADD COLUMN documents_file_paths TEXT NULL COMMENT 'JSON array of document file paths for server-side storage';

-- Update existing records to use new structure if needed
-- (This can be run later if you want to migrate existing base64 data to server files)

-- Show the updated structure
DESCRIBE patient_history;

-- Example of the expected JSON structure for multiple_audio_files:
-- [{"name": "recording1.wav", "filePath": "/uploads/medical-history/P001/audio/1234567890-recording1.wav", "size": 1024, "type": "audio/wav"}]

-- Example of the expected JSON structure for documents_file_paths:
-- [{"name": "report.pdf", "filePath": "/uploads/medical-history/P001/documents/1234567890-report.pdf", "size": 2048, "type": "application/pdf"}]
