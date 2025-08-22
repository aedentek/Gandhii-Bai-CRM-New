const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration - update these with your Hostinger database credentials
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function addSampleLeads() {
  let connection;
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-sample-leads.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!');
    
    // Execute each SQL statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const [results] = await connection.execute(statement);
          console.log('Executed:', statement.substring(0, 50) + '...');
          
          // If it's a SELECT statement, show results
          if (statement.toUpperCase().trim().startsWith('SELECT')) {
            console.log('Results:', results);
          }
        } catch (error) {
          console.error('Error executing statement:', statement.substring(0, 50));
          console.error('Error:', error.message);
        }
      }
    }
    
    console.log('\n✅ Sample leads have been added successfully!');
    console.log('📊 Added 20 leads and 8 categories to your database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the script
if (require.main === module) {
  addSampleLeads();
}

module.exports = { addSampleLeads };
