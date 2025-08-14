import db from './db/config.js';

async function createRolesTable() {
  try {
    console.log('🔧 Creating roles table...');
    
    // Create the table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        status ENUM('active','inactive') DEFAULT 'active',
        createdAt DATE DEFAULT (CURRENT_DATE)
      )
    `);
    
    console.log('✅ Roles table created successfully');
    
    // Check if we have any roles
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM roles');
    console.log('📊 Current roles count:', rows[0].count);
    
    if (rows[0].count === 0) {
      console.log('📝 Inserting default roles...');
      await db.execute(`
        INSERT INTO roles (name, description, status, createdAt) VALUES 
        ('Admin', 'Full system access', 'active', CURDATE()),
        ('Manager', 'Department management access', 'active', CURDATE()),
        ('User', 'Basic user access', 'active', CURDATE())
      `);
      console.log('✅ Default roles inserted');
    }
    
    // Verify the table structure
    const [structure] = await db.execute('DESCRIBE roles');
    console.log('📋 Table structure:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    console.log('✅ Roles table setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up roles table:', error);
  } finally {
    process.exit(0);
  }
}

createRolesTable();
