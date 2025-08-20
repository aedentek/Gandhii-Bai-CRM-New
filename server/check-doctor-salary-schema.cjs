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
  
  // Check doctors table schema
  const checkDoctorsQuery = 'DESCRIBE doctors';
  db.query(checkDoctorsQuery, (err, results) => {
    if (err) {
      console.error('Query failed:', err);
      db.end();
      return;
    }
    
    console.log('\n📋 Doctors table schema:');
    results.forEach((column) => {
      console.log(`- ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check if salary-related fields exist
    const hasTotal_paid = results.some(col => col.Field === 'total_paid');
    const hasPayment_mode = results.some(col => col.Field === 'payment_mode');
    
    console.log('\n🔍 Salary Payment Fields Check:');
    console.log(`- total_paid field: ${hasTotal_paid ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`- payment_mode field: ${hasPayment_mode ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check if we need to add the fields
    if (!hasTotal_paid || !hasPayment_mode) {
      console.log('\n🔧 Adding missing salary payment fields...');
      
      let alterQuery = 'ALTER TABLE doctors ';
      const alterFields = [];
      
      if (!hasTotal_paid) {
        alterFields.push('ADD COLUMN total_paid DECIMAL(10,2) DEFAULT 0');
      }
      
      if (!hasPayment_mode) {
        alterFields.push("ADD COLUMN payment_mode ENUM('Cash', 'Bank', 'UPI', 'Cheque') DEFAULT NULL");
      }
      
      alterQuery += alterFields.join(', ');
      
      db.query(alterQuery, (err, results) => {
        if (err) {
          console.error('❌ Failed to add salary fields:', err);
        } else {
          console.log('✅ Salary payment fields added successfully');
        }
        
        // Now check if salary history tables exist
        checkSalaryTables();
      });
    } else {
      checkSalaryTables();
    }
  });
  
  function checkSalaryTables() {
    // Check if doctor_salary_history table exists
    const checkHistoryQuery = "SHOW TABLES LIKE 'doctor_salary_history'";
    db.query(checkHistoryQuery, (err, results) => {
      if (err) {
        console.error('Query failed:', err);
        db.end();
        return;
      }
      
      if (results.length === 0) {
        console.log('\n❌ doctor_salary_history table does NOT exist');
        console.log('Creating doctor_salary_history table...');
        
        const createHistoryTable = `
          CREATE TABLE IF NOT EXISTS doctor_salary_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id VARCHAR(255) NOT NULL,
            payment_amount DECIMAL(10,2) NOT NULL,
            payment_date DATE NOT NULL,
            payment_mode ENUM('Cash', 'Bank', 'UPI', 'Cheque') NOT NULL,
            previous_total_paid DECIMAL(10,2) DEFAULT 0,
            new_total_paid DECIMAL(10,2) NOT NULL,
            month INT NOT NULL,
            year INT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_doctor_id (doctor_id),
            INDEX idx_date (payment_date),
            INDEX idx_month_year (month, year)
          )
        `;
        
        db.query(createHistoryTable, (err, results) => {
          if (err) {
            console.error('❌ Failed to create doctor_salary_history table:', err);
          } else {
            console.log('✅ doctor_salary_history table created successfully');
          }
          
          checkMonthlySalaryTable();
        });
      } else {
        console.log('\n✅ doctor_salary_history table exists');
        checkMonthlySalaryTable();
      }
    });
  }
  
  function checkMonthlySalaryTable() {
    // Check if doctor_monthly_salary table exists
    const checkMonthlyQuery = "SHOW TABLES LIKE 'doctor_monthly_salary'";
    db.query(checkMonthlyQuery, (err, results) => {
      if (err) {
        console.error('Query failed:', err);
        db.end();
        return;
      }
      
      if (results.length === 0) {
        console.log('\n❌ doctor_monthly_salary table does NOT exist');
        console.log('Creating doctor_monthly_salary table...');
        
        const createMonthlyTable = `
          CREATE TABLE IF NOT EXISTS doctor_monthly_salary (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id VARCHAR(255) NOT NULL,
            month INT NOT NULL,
            year INT NOT NULL,
            total_paid DECIMAL(10,2) DEFAULT 0,
            payment_mode ENUM('Cash', 'Bank', 'UPI', 'Cheque'),
            status ENUM('Paid', 'Pending', 'Partial') DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_doctor_month_year (doctor_id, month, year),
            INDEX idx_doctor_id (doctor_id),
            INDEX idx_month_year (month, year)
          )
        `;
        
        db.query(createMonthlyTable, (err, results) => {
          if (err) {
            console.error('❌ Failed to create doctor_monthly_salary table:', err);
          } else {
            console.log('✅ doctor_monthly_salary table created successfully');
          }
          
          // Final summary
          console.log('\n🎉 Database setup complete!');
          console.log('📊 Summary:');
          console.log('   - doctors table: Updated with salary fields');
          console.log('   - doctor_salary_history table: Created for payment tracking');
          console.log('   - doctor_monthly_salary table: Created for monthly records');
          
          db.end();
        });
      } else {
        console.log('\n✅ doctor_monthly_salary table exists');
        console.log('\n🎉 All required tables exist!');
        db.end();
      }
    });
  }
});
