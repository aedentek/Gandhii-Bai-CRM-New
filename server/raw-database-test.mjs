// Test exactly what happens when we send different date formats
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

async function rawDatabaseTest() {
  let db;
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    const patientId = 102;

    // Test 1: Try writing YYYY-MM-DD format directly
    console.log('\n🧪 Test 1: Direct YYYY-MM-DD format');
    const test1Query = 'UPDATE patients SET admissionDate = ?, dateOfBirth = ? WHERE id = ?';
    const test1Values = ['2025-08-22', '1990-01-20', patientId];
    
    console.log('Query:', test1Query);
    console.log('Values:', test1Values);
    
    await db.execute(test1Query, test1Values);
    
    // Check result
    const [result1] = await db.query('SELECT admissionDate, dateOfBirth FROM patients WHERE id = ?', [patientId]);
    console.log('📋 Result 1:');
    console.log('  admissionDate:', result1[0].admissionDate);
    console.log('  dateOfBirth:', result1[0].dateOfBirth);

    // Test 2: Try a different date to see if it's consistent
    console.log('\n🧪 Test 2: Different valid date');
    const test2Values = ['2025-12-25', '1985-05-15', patientId];
    
    console.log('Query:', test1Query);
    console.log('Values:', test2Values);
    
    await db.execute(test1Query, test2Values);
    
    // Check result
    const [result2] = await db.query('SELECT admissionDate, dateOfBirth FROM patients WHERE id = ?', [patientId]);
    console.log('📋 Result 2:');
    console.log('  admissionDate:', result2[0].admissionDate);
    console.log('  dateOfBirth:', result2[0].dateOfBirth);

    // Test 3: Check if there are any triggers or constraints
    console.log('\n🧪 Test 3: Check table structure');
    const [columns] = await db.query('DESCRIBE patients');
    const dateColumns = columns.filter(col => col.Field === 'admissionDate' || col.Field === 'dateOfBirth');
    
    console.log('📋 Date column definitions:');
    dateColumns.forEach(col => {
      console.log(`  ${col.Field}:`);
      console.log(`    Type: ${col.Type}`);
      console.log(`    Null: ${col.Null}`);
      console.log(`    Default: ${col.Default}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

rawDatabaseTest();
