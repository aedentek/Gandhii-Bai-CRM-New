const mysql = require('mysql2/promise');

async function createPatientsTable() {
  const connection = await mysql.createConnection({
    host: 'srv1616.hstgr.io',
    user: 'u745362362_crm',
    password: 'CrmPass123@',
    database: 'u745362362_crm'
  });

  try {
    console.log('Connecting to database...');
    
    // Drop existing table if exists
    await connection.execute('DROP TABLE IF EXISTS patients');
    console.log('Dropped existing patients table');

    // Create new comprehensive patients table
    const createTableSQL = `
      CREATE TABLE patients (
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
      )
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ Comprehensive patients table created successfully!');
    
    // Verify table creation
    const [tables] = await connection.execute("SHOW TABLES LIKE 'patients'");
    console.log('✅ Table verified:', tables.length > 0 ? 'EXISTS' : 'NOT FOUND');
    
  } catch (error) {
    console.error('❌ Error creating patients table:', error.message);
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

createPatientsTable();
