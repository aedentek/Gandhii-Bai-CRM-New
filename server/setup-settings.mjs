import fs from 'fs';
import db from './db/config.js';

const sqlScript = fs.readFileSync('./dbmodels/create-settings-table.sql', 'utf8');
const statements = sqlScript.split(';').filter(stmt => stmt.trim());

async function setupDatabase() {
  try {
    console.log('Creating app_settings table...');
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      }
    }
    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
