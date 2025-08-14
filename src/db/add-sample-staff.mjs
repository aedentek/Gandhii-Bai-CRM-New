import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function addSampleStaffData() {
  let connection;
  try {
    // First create connection without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD
    });

    // Create database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS healthcare');
    await connection.query('USE healthcare');

    // Create staff table if it doesn't exist
    await connection.query(`CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(15),
      role VARCHAR(50),
      department VARCHAR(50),
      address TEXT,
      join_date DATE,
      salary DECIMAL(10,2),
      status VARCHAR(20),
      photo TEXT,
      documents JSON
    )`);

    console.log('Database and table created successfully');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sample-staff-data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL statements
    await connection.query(sql);
    console.log('Sample staff data inserted successfully');

    // Close the connection
    await connection.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

addSampleStaffData();
