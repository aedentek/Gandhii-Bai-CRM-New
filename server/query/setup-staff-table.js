import mysql from 'mysql2/promise';
import fs from 'fs';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function createStaffTable() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create staff table
    console.log('Creating staff table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(100),
        department VARCHAR(255),
        join_date DATE,
        salary DECIMAL(10,2),
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        photo TEXT,
        documents JSON,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        deleted_by VARCHAR(255) NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Staff table created successfully');

    // Create indexes
    console.log('Creating indexes...');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_staff_deleted_at ON staff(deleted_at)');
    console.log('✅ Indexes created successfully');

    console.log('🎉 Staff table setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createStaffTable();
