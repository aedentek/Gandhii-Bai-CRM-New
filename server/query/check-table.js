import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function checkTable() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check table structure
    console.log('Checking table structure...');
    const [rows] = await connection.execute('DESCRIBE medicine_settlement_history');
    console.log('Table structure:', rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTable();
