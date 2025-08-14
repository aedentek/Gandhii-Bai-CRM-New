import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

async function addQuantityField() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    console.log('Adding quantity field to staff_categories table...');
    await connection.execute(`
      ALTER TABLE staff_categories 
      ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 0
    `);
    console.log('✅ Quantity field added to staff_categories table successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addQuantityField();
