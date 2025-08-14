import fs from 'fs';
import db from './db/config.js';

async function setupRolesTable() {
  try {
    console.log('Creating/updating roles table...');
    
    // First, create the basic table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Check if permissions column exists, if not add it
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'roles' AND COLUMN_NAME = 'permissions'
    `);
    
    if (columns.length === 0) {
      console.log('Adding permissions column...');
      await db.execute('ALTER TABLE roles ADD COLUMN permissions JSON');
    }
    
    // Insert default roles if table is empty
    const [existingRoles] = await db.execute('SELECT COUNT(*) as count FROM roles');
    if (existingRoles[0].count === 0) {
      console.log('Inserting default roles...');
      await db.execute(`
        INSERT INTO roles (name, description, permissions, status) VALUES 
        ('Admin', 'Full system access', '["all"]', 'active'),
        ('Manager', 'Department management access', '["read", "write", "manage_staff"]', 'active'),
        ('User', 'Basic user access', '["read"]', 'active')
      `);
    }
    
    console.log('✅ Roles table setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Roles table setup failed:', error);
    process.exit(1);
  }
}

setupRolesTable();
