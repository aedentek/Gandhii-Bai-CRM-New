import mysql from 'mysql2/promise';
import fs from 'fs';

async function setupMedicineCategoriesTable() {
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
    console.log('🚀 Setting up medicine categories table...');
    
    // Create medicine categories table
    const sql = fs.readFileSync('create-medicine-categories-table.sql', 'utf8');
    await db.execute(sql);
    console.log('✅ Medicine categories table created successfully');
    
    // Insert default medicine categories
    console.log('📝 Adding default medicine categories...');
    const defaultCategories = [
      { name: 'Tablets', description: 'Tablet medications', status: 'active' },
      { name: 'Capsules', description: 'Capsule medications', status: 'active' },
      { name: 'Syrups', description: 'Liquid medications and syrups', status: 'active' },
      { name: 'Injections', description: 'Injectable medications', status: 'active' },
      { name: 'Ointments', description: 'Topical ointments and creams', status: 'active' },
      { name: 'Drops', description: 'Eye drops, ear drops, etc.', status: 'active' },
      { name: 'Antibiotics', description: 'Antibiotic medications', status: 'active' },
      { name: 'Pain Relief', description: 'Pain relief medications', status: 'active' },
      { name: 'Vitamins', description: 'Vitamin supplements', status: 'active' },
      { name: 'Others', description: 'Other medicine types', status: 'active' }
    ];
    
    for (const cat of defaultCategories) {
      try {
        await db.execute(
          'INSERT INTO medicine_categories (name, description, status) VALUES (?, ?, ?)',
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
    
    console.log('\n🎉 Medicine categories setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up medicine categories:', error.message);
  } finally {
    await db.end();
  }
}

setupMedicineCategoriesTable();
