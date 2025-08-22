import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function addDocumentFields() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Adding document fields to patients table...');
    
    // Add document columns to patients table
    const addColumnsSQL = `
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS patientAadhar TEXT AFTER photo,
      ADD COLUMN IF NOT EXISTS patientPan TEXT AFTER patientAadhar,
      ADD COLUMN IF NOT EXISTS attenderAadhar TEXT AFTER patientPan,
      ADD COLUMN IF NOT EXISTS attenderPan TEXT AFTER attenderAadhar
    `;
    
    await connection.execute(addColumnsSQL);
    console.log('✅ Document fields added successfully!');
    
    // Verify the table structure
    const [results] = await connection.execute('DESCRIBE patients');
    console.log('Current table structure:');
    results.forEach(row => {
      console.log(`- ${row.Field}: ${row.Type}`);
    });
    
    await connection.end();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error adding document fields:', error);
    process.exit(1);
  }
}

addDocumentFields();
