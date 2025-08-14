import mysql from 'mysql2/promise';
import fs from 'fs';

async function setupGroceryTables() {
  const db = await mysql.createPool({
    host: 'srv1639.hstgr.io',
    user: 'u745362362_crmusername',
    password: 'Aedentek@123#',
    database: 'u745362362_crm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🚀 Setting up grocery database tables...');
    
    // Read and execute SQL files
    const files = [
      'create-grocery-categories-table.sql',
      'create-grocery-suppliers-table.sql', 
      'create-grocery-products-table.sql',
      'create-grocery-settlement-history-table.sql',
      'create-grocery-stock-history-table.sql'
    ];
    
    for (const file of files) {
      console.log(`📄 Executing ${file}...`);
      const sql = fs.readFileSync(file, 'utf8');
      await db.execute(sql);
      console.log(`✅ ${file} executed successfully`);
    }
    
    console.log('📊 All grocery tables created successfully!');
    
    // Insert default categories
    console.log('📝 Adding default categories...');
    const defaultCategories = [
      { name: 'Vegetables', description: 'Fresh vegetables', status: 'active' },
      { name: 'Fruits', description: 'Fresh fruits', status: 'active' },
      { name: 'Grains', description: 'Rice, wheat, etc.', status: 'active' },
      { name: 'Dairy', description: 'Milk products', status: 'active' },
      { name: 'Meat', description: 'Meat products', status: 'active' },
      { name: 'Beverages', description: 'Drinks and beverages', status: 'active' },
      { name: 'Spices', description: 'Cooking spices', status: 'active' },
      { name: 'Others', description: 'Other grocery items', status: 'active' }
    ];
    
    for (const cat of defaultCategories) {
      try {
        await db.execute(
          'INSERT INTO grocery_categories (name, description, status) VALUES (?, ?, ?)',
          [cat.name, cat.description, cat.status]
        );
        console.log(`✅ Default category '${cat.name}' added`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Category '${cat.name}' already exists`);
        } else {
          console.log(`❌ Error adding category '${cat.name}': ${e.message}`);
        }
      }
    }
    
    // Add a sample supplier
    console.log('👥 Adding sample supplier...');
    try {
      await db.execute(
        'INSERT INTO grocery_suppliers (name, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Sample Grocery Supplier', 'John Doe', 'john@supplier.com', '1234567890', '123 Supplier Street', 'active']
      );
      console.log(`✅ Sample supplier added`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  Sample supplier already exists`);
      } else {
        console.log(`❌ Error adding sample supplier: ${e.message}`);
      }
    }
    
    console.log('\n🎉 Grocery database setup completed successfully!');
    console.log('🌟 You can now use the Grocery Management feature with MySQL backend!');
    
  } catch (error) {
    console.error('❌ Error setting up tables:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.end();
  }
}

setupGroceryTables();
