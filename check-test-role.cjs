const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTestRole() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Aedentek@123#',
    database: process.env.DB_NAME || 'crm_database'
  });
  
  const [rows] = await db.execute('SELECT id, name, permissions FROM roles WHERE id = 17');
  console.log('Test Role Fixed permissions:');
  rows.forEach(r => {
    console.log('ID:', r.id, 'Name:', r.name, 'Permissions:', r.permissions);
    if (r.permissions) {
      try {
        const perms = JSON.parse(r.permissions);
        console.log('Parsed permissions:', perms);
      } catch (e) {
        console.log('Failed to parse permissions:', e.message);
      }
    }
  });
  await db.end();
}
checkTestRole().catch(console.error);
