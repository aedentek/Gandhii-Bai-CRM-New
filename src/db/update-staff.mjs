import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function updateStaffData() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: 'healthcare'
    });

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'update-staff-data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL statements
    await connection.query(sql);
    console.log('Staff data updated successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateStaffData();
