import mysql from 'mysql2/promise';
import fs from 'fs';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function createStaffCategoriesTable() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create staff_categories table
    console.log('Creating staff_categories table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS staff_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Staff categories table created successfully');

    // Create indexes
    console.log('Creating indexes...');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_staff_categories_status ON staff_categories(status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_staff_categories_name ON staff_categories(name)');
    console.log('✅ Indexes created successfully');

    // Insert default categories
    console.log('Inserting default staff categories...');
    const defaultCategories = [
      ['Administrative', 'Administrative and clerical staff', 'active'],
      ['Medical', 'Medical professionals and practitioners', 'active'],
      ['Nursing', 'Nursing staff and assistants', 'active'],
      ['Technical', 'Technical and support staff', 'active'],
      ['Management', 'Management and supervisory roles', 'active'],
      ['Support', 'General support and maintenance staff', 'active']
    ];

    for (const [name, description, status] of defaultCategories) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO staff_categories (name, description, status) VALUES (?, ?, ?)',
          [name, description, status]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.warn(`Warning inserting category ${name}:`, error.message);
        }
      }
    }
    console.log('✅ Default categories inserted');

    console.log('🎉 Staff categories table setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createStaffCategoriesTable();
