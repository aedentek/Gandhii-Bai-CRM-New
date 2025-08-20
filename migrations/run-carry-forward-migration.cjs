const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gandhii_bai_crm'
};

async function runCarryForwardMigration() {
  let connection;
  
  try {
    console.log('🔄 Starting carry forward migration...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'add-carry-forward-columns.sql');
    const sqlCommands = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL commands and execute each one
    const commands = sqlCommands.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`📝 Executing: ${command.trim().substring(0, 50)}...`);
        await connection.execute(command.trim());
      }
    }
    
    console.log('✅ Carry forward migration completed successfully!');
    console.log('📊 doctor_monthly_salary table now has carry forward functionality');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runCarryForwardMigration()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
