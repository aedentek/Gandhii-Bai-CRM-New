// Setup staff attendance table
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function setupStaffAttendanceTable() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('📊 Connected to MySQL database');

    // Read and execute the SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'create-staff-attendance-table.sql'), 'utf8');
    
    await connection.execute(sql);
    console.log('✅ Staff attendance table created successfully');

    await connection.end();
    console.log('📊 Database connection closed');
  } catch (error) {
    console.error('❌ Error setting up staff attendance table:', error.message);
    process.exit(1);
  }
}

setupStaffAttendanceTable();
