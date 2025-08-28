import db from './db/config.js';

async function verifyTable() {
  try {
    // Check if table exists
    const [tables] = await db.query('SHOW TABLES LIKE "medicine_stock_history"');
    
    if (tables.length === 0) {
      console.log('❌ Table does not exist. Creating it now...');
      
      // Create the table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS medicine_stock_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          stock_change INT NOT NULL,
          stock_type ENUM('used', 'added', 'adjusted') DEFAULT 'used',
          current_stock_before INT NOT NULL,
          current_stock_after INT NOT NULL,
          update_date DATE NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `;
      
      await db.query(createTableSQL);
      
      // Add indexes
      await db.query('CREATE INDEX IF NOT EXISTS idx_medicine_stock_history_product_id ON medicine_stock_history(product_id)');
      await db.query('CREATE INDEX IF NOT EXISTS idx_medicine_stock_history_date ON medicine_stock_history(update_date)');
      
      console.log('✅ Table created successfully!');
    } else {
      console.log('✅ Table already exists!');
    }
    
    // Show table structure
    const [structure] = await db.query('DESCRIBE medicine_stock_history');
    console.log('📋 Table structure:');
    console.table(structure);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyTable();
