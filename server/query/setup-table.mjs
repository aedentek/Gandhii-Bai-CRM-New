import mysql from 'mysql2/promise';

const db = await mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

try {
  console.log('Creating patients table...');
  
  await db.execute('DROP TABLE IF EXISTS patients');
  console.log('Dropped existing table');
  
  await db.execute(`
    CREATE TABLE patients (
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
    )
  `);
  
  console.log('✅ Patients table created successfully!');
  
  const [result] = await db.execute('SELECT COUNT(*) as count FROM patients');
  console.log('✅ Table verified with', result[0].count, 'records');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
