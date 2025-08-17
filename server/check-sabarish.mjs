import mysql from 'mysql2/promise';

async function checkPatientData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });
  
  console.log('Checking available databases...');
  const [dbs] = await connection.execute('SHOW DATABASES');
  console.table(dbs);
  
  // Try to find the correct database
  const dbNames = ['crm', 'crm5', 'healthcare'];
  for (let dbName of dbNames) {
    try {
      await connection.execute(`USE ${dbName}`);
      console.log(`\nUsing database: ${dbName}`);
      
      // Check if PatientList table exists
      const [tables] = await connection.execute('SHOW TABLES');
      console.log('Available tables:');
      console.table(tables);
      
      // Check if PatientList table exists
      if (tables.some(table => Object.values(table)[0] === 'PatientList')) {
        const [rows] = await connection.execute(`
          SELECT name, otherFees, payAmount, pickupCharge, bloodTest, fees, admissionDate 
          FROM PatientList 
          WHERE name LIKE "%Sabarish%"
        `);
        
        console.log('Sabarish data from database:');
        console.table(rows);
        break;
      }
    } catch (err) {
      console.log(`Database ${dbName} not accessible: ${err.message}`);
    }
  }
  
  await connection.end();
}

checkPatientData().catch(console.error);
