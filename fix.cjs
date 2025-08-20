const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'gandhii_bai_crm'
  });
  
  await conn.execute("UPDATE doctors SET join_date = '01-06-2023' WHERE join_date IS NULL");
  console.log('FIXED');
  
  await conn.end();
})();
