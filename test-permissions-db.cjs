const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPermissionsDB() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Aedentek@123#',
      database: process.env.DB_NAME || 'crm_database'
    });

    console.log('✅ Database connected');

    // Check current roles and their permissions
    const [roles] = await connection.execute('SELECT id, name, permissions FROM roles ORDER BY id DESC LIMIT 5');
    
    console.log('\n📋 Current roles with permissions:');
    roles.forEach(role => {
      console.log(`ID: ${role.id}, Name: ${role.name}`);
      if (role.permissions) {
        try {
          const perms = JSON.parse(role.permissions);
          console.log(`   Permissions: ${perms.length} permissions - ${perms.slice(0, 3).join(', ')}${perms.length > 3 ? '...' : ''}`);
        } catch (e) {
          console.log(`   Permissions: ${role.permissions}`);
        }
      } else {
        console.log('   Permissions: NULL');
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPermissionsDB();
