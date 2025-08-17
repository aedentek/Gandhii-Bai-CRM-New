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
  
  // Check what tables exist
  const query = 'SHOW TABLES';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Query failed:', err);
      db.end();
      return;
    }
    
    console.log('\nTables in database:');
    results.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    db.end();
  });
});
