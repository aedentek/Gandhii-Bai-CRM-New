import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createPatientMonthlyRecordsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS patient_monthly_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id VARCHAR(20) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        monthly_fees DECIMAL(10,2) DEFAULT 0,
        other_fees DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) DEFAULT 0,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        amount_pending DECIMAL(10,2) DEFAULT 0,
        carry_forward_from_previous DECIMAL(10,2) DEFAULT 0,
        carry_forward_to_next DECIMAL(10,2) DEFAULT 0,
        net_balance DECIMAL(10,2) DEFAULT 0,
        payment_status ENUM('pending', 'partial', 'completed', 'overpaid') DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_patient_id (patient_id),
        INDEX idx_month_year (month, year),
        UNIQUE KEY unique_patient_month_year (patient_id, month, year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    console.log('✅ Patient monthly records table created/verified successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createPatientMonthlyRecordsTable();
