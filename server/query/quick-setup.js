const db = require('./db');
const fs = require('fs');

async function setupPatientsTable() {
  try {
    console.log('Setting up patients table...');
    
    // Drop existing table
    await db.execute('DROP TABLE IF EXISTS patients');
    console.log('Dropped existing patients table');
    
    // Read the SQL file
    const sql = fs.readFileSync('./create-patients-table.sql', 'utf8');
    
    // Execute the SQL
    await db.execute(sql);
    console.log('✅ Patients table created successfully!');
    
    // Test the table
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM patients');
    console.log('✅ Table verified, current records:', rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupPatientsTable();
