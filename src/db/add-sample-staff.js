const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSampleStaffData() {
  try {
    // Create the connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000,
      ssl: false
    });

    console.log('Connected to database successfully');

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
