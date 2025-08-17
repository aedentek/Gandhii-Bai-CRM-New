const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'gandhii_bai_crm',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('Checking general_products table schema...');
    const [columns] = await db.execute('DESCRIBE general_products');
    console.log('Columns:');
    columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    
    console.log('\nSample data:');
    const [sample] = await db.execute('SELECT * FROM general_products LIMIT 1');
    if (sample.length > 0) {
      console.log('Sample record:');
      Object.keys(sample[0]).forEach(key => {
        console.log(`- ${key}: ${sample[0][key]}`);
      });
    } else {
      console.log('No data found');
    }
    
    await db.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
