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
  
  // Check if doctor_advance table exists
  const checkTableQuery = "SHOW TABLES LIKE 'doctor_advance'";
  db.query(checkTableQuery, (err, results) => {
    if (err) {
      console.error('Query failed:', err);
      db.end();
      return;
    }
    
    if (results.length === 0) {
      console.log('\n❌ doctor_advance table does NOT exist in the database');
      console.log('\nCreating doctor_advance table...');
      
      // Create the table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS doctor_advance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          doctor_id VARCHAR(255) NOT NULL,
          doctor_name VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_doctor_id (doctor_id),
          INDEX idx_date (date)
        )
      `;
      
      db.query(createTableQuery, (err, results) => {
        if (err) {
          console.error('Failed to create doctor_advance table:', err);
        } else {
          console.log('✅ doctor_advance table created successfully');
        }
        db.end();
      });
      
    } else {
      console.log('\n✅ doctor_advance table exists in the database');
      
      // Check table schema
      const query = 'DESCRIBE doctor_advance';
      db.query(query, (err, results) => {
        if (err) {
          console.error('Query failed:', err);
          db.end();
          return;
        }
        
        console.log('\ndoctor_advance table schema:');
        results.forEach((column) => {
          console.log(`- ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Check if there's any data
        const countQuery = 'SELECT COUNT(*) as count FROM doctor_advance';
        db.query(countQuery, (err, results) => {
          if (err) {
            console.error('Count query failed:', err);
          } else {
            console.log(`\nNumber of records: ${results[0].count}`);
          }
          db.end();
        });
      });
    }
  });
});
