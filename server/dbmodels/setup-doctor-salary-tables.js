import fs from 'fs';
import path from 'path';
import db from '../db/config.js';

async function createDoctorSalaryTables() {
  try {
    console.log('🔧 Creating doctor salary tables...');
    
    const sqlFile = path.join(process.cwd(), 'server', 'dbmodels', 'create-doctor-salary-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await db.execute(statement.trim());
      }
    }
    
    console.log('✅ Doctor salary tables created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createDoctorSalaryTables();
