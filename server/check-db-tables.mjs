import db from './db/config.js';

(async () => {
  try {
    console.log('✅ Checking database data...');
    
    const [usersData] = await db.execute('SELECT id, username, user_role FROM management_users');
    console.log('📊 Users data:', usersData.length, 'records');
    usersData.forEach(user => console.log(`- ${user.username} (${user.user_role})`));
    
    const [rolesData] = await db.execute('SELECT id, name, description, status FROM roles');
    console.log('\n📊 Roles data:', rolesData.length, 'records');
    rolesData.forEach(role => console.log(`- ${role.name} (${role.status})`));
    
    await db.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
