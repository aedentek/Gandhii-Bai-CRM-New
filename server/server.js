import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import process from 'process';
import tcpPortUsed from 'tcp-port-used';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
const db = mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to kill process using a port
async function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      await execAsync(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /F /PID %a`);
    } else {
      await execAsync(`lsof -ti:${port} | xargs kill -9`);
    }
    console.log(`✅ Terminated existing process on port ${port}`);
  } catch (err) {
    console.error('Error killing process:', err.message);
  }
}

// Server startup with automatic port handling
async function startServer() {
  try {
    // Check if port is in use
    const isPortInUse = await tcpPortUsed.check(PORT);
    if (isPortInUse) {
      console.log(`⚠️ Port ${PORT} is already in use. Attempting to free it...`);
      await killProcessOnPort(PORT);
      // Wait a moment for the port to be freed
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test database connection
    const connection = await db.getConnection();
    console.log('✅ Database connection successful');
    connection.release();

    // Start server
    app.listen(PORT, () => {
      console.log(`
🚀 Server is running on port ${PORT}
📝 CRM API endpoints are ready
💾 Database connection established
      `);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Export for use in index.js
export { app, db, startServer };
