const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database u745362362_crm');
  
  // Check patients table schema
  const query = 'DESCRIBE patients';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Query failed:', err);
      db.end();
      return;
    }
    
    console.log('\nPatients table schema:');
    results.forEach((column) => {
      console.log(`- ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    db.end();
  });
});
