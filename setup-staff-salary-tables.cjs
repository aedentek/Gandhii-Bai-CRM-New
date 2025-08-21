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
  
  setupStaffSalaryTables();
});

function setupStaffSalaryTables() {
  console.log('\n🔧 Setting up Staff Salary Management Tables...\n');
  
  // 1. Create staff_monthly_salary table
  const createMonthlyTable = `
    CREATE TABLE IF NOT EXISTS staff_monthly_salary (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id VARCHAR(20) NOT NULL,
      month INT NOT NULL,
      year INT NOT NULL,
      base_salary DECIMAL(10,2) DEFAULT 0,
      total_paid DECIMAL(10,2) DEFAULT 0,
      advance_amount DECIMAL(10,2) DEFAULT 0,
      carry_forward_from_previous DECIMAL(10,2) DEFAULT 0,
      carry_forward_to_next DECIMAL(10,2) DEFAULT 0,
      net_balance DECIMAL(10,2) DEFAULT 0,
      status ENUM('Pending', 'Paid', 'Overpaid') DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_staff_id (staff_id),
      INDEX idx_month_year (month, year),
      INDEX idx_staff_month_year (staff_id, month, year),
      INDEX idx_status (status),
      
      UNIQUE KEY unique_staff_month_year (staff_id, month, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createMonthlyTable, (err, result) => {
    if (err) {
      console.error('❌ Failed to create staff_monthly_salary table:', err);
    } else {
      console.log('✅ staff_monthly_salary table created successfully');
    }
    
    // 2. Create staff_salary_settlements table
    createSettlementsTable();
  });
}

function createSettlementsTable() {
  const createSettlementsTable = `
    CREATE TABLE IF NOT EXISTS staff_salary_settlements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id VARCHAR(20) NOT NULL,
      staff_name VARCHAR(255) NOT NULL,
      payment_date DATE NOT NULL,
      payment_amount DECIMAL(10,2) NOT NULL,
      payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') DEFAULT 'Bank Transfer',
      type ENUM('salary', 'advance', 'bonus', 'incentive', 'allowance') DEFAULT 'salary',
      month INT NOT NULL,
      year INT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_staff_id (staff_id),
      INDEX idx_payment_date (payment_date),
      INDEX idx_month_year (month, year),
      INDEX idx_staff_month_year (staff_id, month, year),
      INDEX idx_type (type),
      INDEX idx_payment_mode (payment_mode)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createSettlementsTable, (err, result) => {
    if (err) {
      console.error('❌ Failed to create staff_salary_settlements table:', err);
    } else {
      console.log('✅ staff_salary_settlements table created successfully');
    }
    
    // 3. Create staff_salary_history table
    createHistoryTable();
  });
}

function createHistoryTable() {
  const createHistoryTable = `
    CREATE TABLE IF NOT EXISTS staff_salary_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id VARCHAR(20) NOT NULL,
      staff_name VARCHAR(255) NOT NULL,
      salary_month INT NOT NULL,
      salary_year INT NOT NULL,
      base_salary DECIMAL(10,2) NOT NULL,
      payment_amount DECIMAL(10,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') DEFAULT 'Bank Transfer',
      type ENUM('salary', 'advance', 'bonus', 'incentive', 'allowance') DEFAULT 'salary',
      advance_amount DECIMAL(10,2) DEFAULT 0,
      balance_amount DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_staff_id (staff_id),
      INDEX idx_salary_month_year (salary_month, salary_year),
      INDEX idx_staff_salary_period (staff_id, salary_month, salary_year),
      INDEX idx_payment_date (payment_date),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createHistoryTable, (err, result) => {
    if (err) {
      console.error('❌ Failed to create staff_salary_history table:', err);
    } else {
      console.log('✅ staff_salary_history table created successfully');
    }
    
    // 4. Insert sample data
    insertSampleData();
  });
}

function insertSampleData() {
  console.log('\n📊 Inserting sample data...');
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Sample monthly salary records
  const monthlyRecords = [
    ['STF001', currentMonth, currentYear, 75000.00, 0, 0, 0, 75000.00, 'Pending'],
    ['STF002', currentMonth, currentYear, 45000.00, 0, 0, 0, 45000.00, 'Pending'],
    ['STF003', currentMonth, currentYear, 55000.00, 0, 0, 0, 55000.00, 'Pending'],
    ['STF004', currentMonth, currentYear, 45000.00, 0, 0, 0, 45000.00, 'Pending']
  ];
  
  const insertMonthlyQuery = `
    INSERT IGNORE INTO staff_monthly_salary 
    (staff_id, month, year, base_salary, total_paid, advance_amount, carry_forward_from_previous, net_balance, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  let completed = 0;
  const total = monthlyRecords.length;
  
  monthlyRecords.forEach((record, index) => {
    db.query(insertMonthlyQuery, record, (err, result) => {
      if (err) {
        console.error(`❌ Failed to insert monthly record ${index + 1}:`, err);
      } else {
        console.log(`✅ Monthly record ${index + 1} inserted successfully`);
      }
      
      completed++;
      if (completed === total) {
        insertPaymentSamples();
      }
    });
  });
}

function insertPaymentSamples() {
  // Sample payment settlement records
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const paymentRecords = [
    ['STF001', 'John Smith', '2025-08-15', 25000.00, 'Bank Transfer', 'salary', currentMonth, currentYear, 'Partial salary payment for August 2025'],
    ['STF002', 'Sarah Johnson', '2025-08-10', 15000.00, 'UPI', 'salary', currentMonth, currentYear, 'Advance payment for August 2025'],
    ['STF003', 'Michael Brown', '2025-08-12', 30000.00, 'Bank Transfer', 'salary', currentMonth, currentYear, 'Partial payment for August 2025']
  ];
  
  const insertPaymentQuery = `
    INSERT IGNORE INTO staff_salary_settlements 
    (staff_id, staff_name, payment_date, payment_amount, payment_mode, type, month, year, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  let completed = 0;
  const total = paymentRecords.length;
  
  paymentRecords.forEach((record, index) => {
    db.query(insertPaymentQuery, record, (err, result) => {
      if (err) {
        console.error(`❌ Failed to insert payment record ${index + 1}:`, err);
      } else {
        console.log(`✅ Payment record ${index + 1} inserted successfully`);
      }
      
      completed++;
      if (completed === total) {
        insertHistorySamples();
      }
    });
  });
}

function insertHistorySamples() {
  // Sample salary history records
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const historyRecords = [
    ['STF001', 'John Smith', currentMonth, currentYear, 75000.00, 25000.00, '2025-08-15', 'Bank Transfer', 'salary', 2000.00, 52000.00, 'Partial payment with advance deduction'],
    ['STF002', 'Sarah Johnson', currentMonth, currentYear, 45000.00, 15000.00, '2025-08-10', 'UPI', 'salary', 1500.00, 28500.00, 'Early payment for August'],
    ['STF003', 'Michael Brown', currentMonth, currentYear, 55000.00, 30000.00, '2025-08-12', 'Bank Transfer', 'salary', 3000.00, 22000.00, 'Mid-month payment']
  ];
  
  const insertHistoryQuery = `
    INSERT IGNORE INTO staff_salary_history 
    (staff_id, staff_name, salary_month, salary_year, base_salary, payment_amount, payment_date, payment_mode, type, advance_amount, balance_amount, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  let completed = 0;
  const total = historyRecords.length;
  
  historyRecords.forEach((record, index) => {
    db.query(insertHistoryQuery, record, (err, result) => {
      if (err) {
        console.error(`❌ Failed to insert history record ${index + 1}:`, err);
      } else {
        console.log(`✅ History record ${index + 1} inserted successfully`);
      }
      
      completed++;
      if (completed === total) {
        finishSetup();
      }
    });
  });
}

function finishSetup() {
  console.log('\n🎉 Staff Salary Management Tables Setup Complete!');
  console.log('\n📋 Summary:');
  console.log('✅ staff_monthly_salary table created');
  console.log('✅ staff_salary_settlements table created');
  console.log('✅ staff_salary_history table created');
  console.log('✅ Sample data inserted');
  console.log('\n📊 Ready for Staff Salary Management!');
  
  db.end();
}
