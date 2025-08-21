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
  
  // Check if staff_advance table exists
  const checkTableQuery = "SHOW TABLES LIKE 'staff_advance'";
  db.query(checkTableQuery, (err, results) => {
    if (err) {
      console.error('Query failed:', err);
      db.end();
      return;
    }
    
    if (results.length === 0) {
      console.log('\n❌ staff_advance table does NOT exist in the database');
      console.log('\nCreating staff_advance table...');
      
      // Create the table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS staff_advance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          staff_id VARCHAR(255) NOT NULL,
          staff_name VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_staff_id (staff_id),
          INDEX idx_date (date)
        )
      `;
      
      db.query(createTableQuery, (err, results) => {
        if (err) {
          console.error('Failed to create staff_advance table:', err);
        } else {
          console.log('✅ staff_advance table created successfully');
          
          // Insert sample data
          const sampleData = [
            ['STF001', 'John Smith', '2025-08-15', 2000.00, 'Medical emergency advance'],
            ['STF002', 'Sarah Johnson', '2025-08-10', 1500.00, 'Personal emergency'],
            ['STF003', 'Mike Wilson', '2025-08-12', 3000.00, 'Family function expenses']
          ];
          
          const insertQuery = `
            INSERT INTO staff_advance (staff_id, staff_name, date, amount, reason)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          let insertCount = 0;
          sampleData.forEach((row, index) => {
            db.query(insertQuery, row, (err, result) => {
              if (err) {
                console.error(`Failed to insert sample data ${index + 1}:`, err);
              } else {
                console.log(`✅ Sample data ${index + 1} inserted successfully`);
              }
              
              insertCount++;
              if (insertCount === sampleData.length) {
                console.log('\n🎉 staff_advance table setup completed!');
                console.log('📊 Table created with sample data for testing');
                db.end();
              }
            });
          });
        }
      });
      
    } else {
      console.log('\n✅ staff_advance table exists in the database');
      
      // Check table schema
      const query = 'DESCRIBE staff_advance';
      db.query(query, (err, results) => {
        if (err) {
          console.error('Query failed:', err);
          db.end();
          return;
        }
        
        console.log('\nstaff_advance table schema:');
        results.forEach((column) => {
          console.log(`- ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Check if there's any data
        const countQuery = 'SELECT COUNT(*) as count FROM staff_advance';
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
