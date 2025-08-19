import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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

    // Test creating a role with permissions
    const testPermissions = ['dashboard', 'add-patient', 'patient-list', 'staff-list'];
    const [result] = await connection.execute(
      'INSERT INTO roles (name, description, permissions, status, createdAt) VALUES (?, ?, ?, ?, NOW())',
      ['Test Permission Role', 'Testing permissions storage', JSON.stringify(testPermissions), 'active']
    );

    console.log(`✅ Created test role with ID: ${result.insertId}`);

    // Verify the role was created with permissions
    const [testRole] = await connection.execute('SELECT id, name, permissions FROM roles WHERE id = ?', [result.insertId]);
    if (testRole.length > 0) {
      const role = testRole[0];
      const perms = JSON.parse(role.permissions);
      console.log(`✅ Verified: Role "${role.name}" has ${perms.length} permissions: ${perms.join(', ')}`);
    }

    // Clean up - delete the test role
    await connection.execute('DELETE FROM roles WHERE id = ?', [result.insertId]);
    console.log('✅ Test role cleaned up');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPermissionsDB();
