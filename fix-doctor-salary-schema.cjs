import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

async function fixDoctorSalarySchema() {
  let connection;
  
  try {
    console.log('🔄 Starting database schema fix...');
    console.log('Database config:', dbConfig);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('🔍 Connected to database. Checking doctor salary schema...');

    // First, check if tables exist
    console.log('\n📋 Checking existing tables...');
    
    // Check doctor_monthly_salary table structure
    try {
      const [monthlySalaryColumns] = await connection.execute(
        'DESCRIBE doctor_monthly_salary'
      );
      console.log('✅ doctor_monthly_salary table exists with columns:', monthlySalaryColumns.map(col => col.Field));
    } catch (error) {
      console.log('❌ doctor_monthly_salary table does not exist, creating...');
      
      await connection.execute(`
        CREATE TABLE doctor_monthly_salary (
          id INT AUTO_INCREMENT PRIMARY KEY,
          doctor_id VARCHAR(50) NOT NULL,
          month INT NOT NULL,
          year INT NOT NULL,
          total_paid DECIMAL(15,2) DEFAULT 0,
          payment_mode VARCHAR(50) DEFAULT 'Cash',
          status VARCHAR(50) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_doctor_month_year (doctor_id, month, year),
          INDEX idx_doctor_id (doctor_id),
          INDEX idx_month_year (month, year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Created doctor_monthly_salary table');
    }

    // Check doctor_salary_history table structure
    try {
      const [historyColumns] = await connection.execute(
        'DESCRIBE doctor_salary_history'
      );
      console.log('✅ doctor_salary_history table exists with columns:', historyColumns.map(col => col.Field));
    } catch (error) {
      console.log('❌ doctor_salary_history table does not exist, creating...');
      
      await connection.execute(`
        CREATE TABLE doctor_salary_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          doctor_id VARCHAR(50) NOT NULL,
          payment_amount DECIMAL(15,2) NOT NULL,
          payment_date DATE NOT NULL,
          payment_mode VARCHAR(50) DEFAULT 'Cash',
          previous_total_paid DECIMAL(15,2) DEFAULT 0,
          new_total_paid DECIMAL(15,2) NOT NULL,
          month INT NOT NULL,
          year INT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_doctor_id (doctor_id),
          INDEX idx_payment_date (payment_date),
          INDEX idx_month_year (month, year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Created doctor_salary_history table');
    }

    // Check if total_paid column exists in doctor_monthly_salary
    const [monthlySalaryColumns] = await connection.execute(
      'DESCRIBE doctor_monthly_salary'
    );
    
    const hasTotalPaid = monthlySalaryColumns.some(col => col.Field === 'total_paid');
    
    if (!hasTotalPaid) {
      console.log('❌ total_paid column missing in doctor_monthly_salary, adding...');
      await connection.execute(`
        ALTER TABLE doctor_monthly_salary 
        ADD COLUMN total_paid DECIMAL(15,2) DEFAULT 0 AFTER year
      `);
      console.log('✅ Added total_paid column to doctor_monthly_salary');
    }

    // Test the query from the API
    console.log('\n🧪 Testing the API query...');
    try {
      const [testRows] = await connection.execute(`
        SELECT 
          d.*,
          COALESCE(dms.total_paid, 0) as total_paid,
          dms.month,
          dms.year,
          dms.payment_mode,
          dms.status,
          dms.updated_at as last_payment_date
        FROM doctors d
        LEFT JOIN doctor_monthly_salary dms ON d.id = dms.doctor_id 
          AND dms.month = MONTH(CURDATE()) 
          AND dms.year = YEAR(CURDATE())
        WHERE d.status = 'Active'
        ORDER BY d.name ASC
        LIMIT 5
      `);
      console.log(`✅ API query works! Found ${testRows.length} active doctors`);
      
      if (testRows.length > 0) {
        console.log('Sample doctor:', {
          id: testRows[0].id,
          name: testRows[0].name,
          total_paid: testRows[0].total_paid
        });
      }
    } catch (testError) {
      console.log('❌ API query failed:', testError.message);
    }

    console.log('\n🎉 Doctor salary schema setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up doctor salary schema:', error);
  } finally {
    if (connection) await connection.end();
  }
}

fixDoctorSalarySchema();
