const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function createMedicineTables() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Create medicine_categories table
    console.log('Creating medicine_categories table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS medicine_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ medicine_categories table created');
    
    // Create medicine_suppliers table
    console.log('Creating medicine_suppliers table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS medicine_suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ medicine_suppliers table created');
    
    // Create medicine_products table
    console.log('Creating medicine_products table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS medicine_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        manufacturer VARCHAR(255),
        supplier VARCHAR(255),
        batch_number VARCHAR(100),
        expiry_date DATE,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        current_stock INT DEFAULT 0,
        used_stock INT DEFAULT 0,
        balance_stock INT DEFAULT 0,
        stock_status ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock',
        status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
        purchase_date DATE,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        purchase_amount DECIMAL(10,2) DEFAULT 0,
        settlement_amount DECIMAL(10,2) DEFAULT 0,
        balance_amount DECIMAL(10,2) DEFAULT 0,
        payment_status ENUM('pending', 'partial', 'completed') DEFAULT 'pending',
        payment_type ENUM('cash', 'credit', 'bank_transfer', 'cheque') DEFAULT 'cash',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ medicine_products table created');
    
    // Create medicine_settlement_history table
    console.log('Creating medicine_settlement_history table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS medicine_settlement_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        product_name VARCHAR(255),
        category VARCHAR(255),
        supplier VARCHAR(255),
        purchase_date DATE,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_type ENUM('cash', 'credit', 'bank_transfer', 'cheque') DEFAULT 'cash',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES medicine_products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ medicine_settlement_history table created');
    
    // Create medicine_stock_history table
    console.log('Creating medicine_stock_history table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS medicine_stock_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        product_name VARCHAR(255),
        category VARCHAR(255),
        supplier VARCHAR(255),
        purchase_date DATE,
        stock_change INT NOT NULL,
        stock_type ENUM('purchased', 'used', 'adjusted', 'expired', 'returned') DEFAULT 'used',
        current_stock_before INT DEFAULT 0,
        current_stock_after INT DEFAULT 0,
        update_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES medicine_products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ medicine_stock_history table created');
    
    // Insert default categories
    console.log('Inserting default categories...');
    const categories = [
      ['Tablets', 'Medicine in tablet form'],
      ['Capsules', 'Medicine in capsule form'],
      ['Syrup', 'Liquid medicine'],
      ['Injection', 'Injectable medicine'],
      ['Ointment', 'Topical medicine'],
      ['Drops', 'Medicine in drop form']
    ];
    
    for (const [name, description] of categories) {
      await connection.execute(
        'INSERT IGNORE INTO medicine_categories (name, description) VALUES (?, ?)',
        [name, description]
      );
    }
    console.log('✅ Default categories inserted');
    
    // Insert default suppliers
    console.log('Inserting default suppliers...');
    const suppliers = [
      ['PharmaCorp Ltd', 'Dr. Smith', 'smith@pharmacorp.com', '+1-555-0101', '123 Pharma Street'],
      ['MediSupply Inc', 'Ms. Johnson', 'johnson@medisupply.com', '+1-555-0102', '456 Medicine Ave'],
      ['HealthCare Solutions', 'Dr. Brown', 'brown@healthcare.com', '+1-555-0103', '789 Wellness Blvd']
    ];
    
    for (const [name, contact_person, email, phone, address] of suppliers) {
      await connection.execute(
        'INSERT IGNORE INTO medicine_suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [name, contact_person, email, phone, address]
      );
    }
    console.log('✅ Default suppliers inserted');
    
    console.log('🎉 Medicine database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createMedicineTables();
