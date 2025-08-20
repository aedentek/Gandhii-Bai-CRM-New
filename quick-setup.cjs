const mysql = require('mysql2/promise');

async function quickSetupCarryForward() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    // Create the table if it doesn't exist
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS doctor_monthly_salary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id VARCHAR(255) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        base_salary DECIMAL(10,2) DEFAULT 0,
        carry_forward_from_previous DECIMAL(10,2) DEFAULT 0,
        carry_forward_to_next DECIMAL(10,2) DEFAULT 0,
        total_due DECIMAL(10,2) DEFAULT 0,
        total_paid DECIMAL(10,2) DEFAULT 0,
        balance DECIMAL(10,2) DEFAULT 0,
        payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') DEFAULT 'Bank Transfer',
        status ENUM('Pending', 'Partial', 'Paid') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_doctor_month_year (doctor_id, month, year)
      )
    `);
    
    // Insert sample data for current month
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const [doctors] = await conn.execute('SELECT id, name FROM doctors WHERE status = "Active" LIMIT 3');
    
    for (const doctor of doctors) {
      await conn.execute(`
        INSERT INTO doctor_monthly_salary 
        (doctor_id, month, year, carry_forward_from_previous, carry_forward_to_next, status)
        VALUES (?, ?, ?, 3000, 0, 'Pending')
        ON DUPLICATE KEY UPDATE
        carry_forward_from_previous = 3000
      `, [doctor.id, month, year]);
    }
    
    console.log('SETUP COMPLETE');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
}

quickSetupCarryForward();
