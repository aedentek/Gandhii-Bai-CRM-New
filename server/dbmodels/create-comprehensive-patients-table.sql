-- Comprehensive patients table for Gandhi Bai CRM system
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT,
  gender ENUM('Male', 'Female', 'Other'),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  emergencyContact VARCHAR(20),
  medicalHistory TEXT,
  admissionDate DATE,
  status ENUM('Active', 'Inactive', 'Critical', 'Discharged') DEFAULT 'Active',
  attenderName VARCHAR(255),
  attenderPhone VARCHAR(20),
  attenderRelationship VARCHAR(100),
  photo TEXT,
  fees DECIMAL(10,2) DEFAULT 0,
  bloodTest DECIMAL(10,2) DEFAULT 0,
  pickupCharge DECIMAL(10,2) DEFAULT 0,
  totalAmount DECIMAL(10,2) DEFAULT 0,
  payAmount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  paymentType ENUM('Cash', 'Card', 'UPI', 'Bank Transfer', 'Insurance'),
  fatherName VARCHAR(255),
  motherName VARCHAR(255),
  dateOfBirth DATE,
  marriageStatus ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  employeeStatus ENUM('Employed', 'Unemployed', 'Self-Employed', 'Retired', 'Student'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Index for better performance
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_admission_date ON patients(admissionDate);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_is_deleted ON patients(is_deleted);
