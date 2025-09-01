import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connection config using environment variables with fallback to hardcoded values
const db = await mysql.createPool({
  host: process.env.DB_HOST || 'srv1639.hstgr.io',
  user: process.env.DB_USER || 'u745362362_crmusername',
  password: process.env.DB_PASSWORD || 'Aedentek@123#',
  database: process.env.DB_NAME || 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;