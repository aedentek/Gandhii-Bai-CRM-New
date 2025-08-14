-- Comprehensive patients table for Gandhi Bai CRM system
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT,
  gender VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  emergencyContact VARCHAR(20),
  medicalHistory TEXT,
  admissionDate DATE,
  status VARCHAR(20) DEFAULT 'Active',
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
  paymentType VARCHAR(50),
  fatherName VARCHAR(255),
  motherName VARCHAR(255),
  dateOfBirth DATE,
  marriageStatus VARCHAR(20),
  employeeStatus VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Table for patient payments
CREATE TABLE IF NOT EXISTS patient_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientId INT NOT NULL,
  date VARCHAR(20),
  amount DECIMAL(10,2),
  comment TEXT,
  paymentMode VARCHAR(50),
  balanceRemaining DECIMAL(10,2),
  createdBy VARCHAR(100),
  createdAt VARCHAR(30),
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
);
