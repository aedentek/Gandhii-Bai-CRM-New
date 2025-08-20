// Simple test to check doctors table structure
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

async function checkDoctorsTable() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📋 Checking doctors table structure...');
    const [columns] = await connection.execute('DESCRIBE doctors');
    
    console.log('📊 Doctors table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n👥 Sample data from doctors table:');
    const [sampleData] = await connection.execute('SELECT * FROM doctors LIMIT 2');
    
    sampleData.forEach((doctor, index) => {
      console.log(`\nDoctor ${index + 1}:`);
      Object.entries(doctor).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDoctorsTable();
