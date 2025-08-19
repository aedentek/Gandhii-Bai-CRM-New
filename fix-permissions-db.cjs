const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPermissions() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Aedentek@123#',
      database: process.env.DB_NAME || 'crm_database'
    });

    console.log('✅ Database connected');

    // Define test permissions for different roles
    const testPermissions = {
      'Admin': ['dashboard', 'add-patient', 'patient-list', 'add-staff', 'staff-list', 'add-doctor', 'doctor-list'],
      'Test Admin': ['dashboard', 'patient-list', 'staff-list'],
      'Administration': ['dashboard', 'add-patient', 'patient-list'],
      'Super Admin': ['dashboard', 'add-patient', 'patient-list', 'add-staff', 'staff-list', 'add-doctor', 'doctor-list', 'add-medicine', 'settings']
    };

    console.log('\n📋 Updating roles with test permissions:');
    
    for (const [roleName, permissions] of Object.entries(testPermissions)) {
      const permissionsJSON = JSON.stringify(permissions);
      
      const [result] = await connection.execute(
        'UPDATE roles SET permissions = ? WHERE name = ?',
        [permissionsJSON, roleName]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ Updated "${roleName}" with ${permissions.length} permissions: ${permissions.slice(0, 3).join(', ')}${permissions.length > 3 ? '...' : ''}`);
      } else {
        console.log(`⚠️  Role "${roleName}" not found in database`);
      }
    }

    // Verify the updates
    console.log('\n📋 Verifying updated permissions:');
    const [roles] = await connection.execute('SELECT id, name, permissions FROM roles WHERE permissions IS NOT NULL ORDER BY id');
    
    roles.forEach(role => {
      try {
        const perms = JSON.parse(role.permissions);
        console.log(`✅ Role "${role.name}" (ID: ${role.id}) has ${perms.length} permissions: ${perms.slice(0, 4).join(', ')}${perms.length > 4 ? '...' : ''}`);
      } catch (e) {
        console.log(`❌ Role "${role.name}" (ID: ${role.id}) has invalid JSON: ${role.permissions}`);
      }
    });

    console.log('\n🎉 Database permissions update completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixPermissions();
