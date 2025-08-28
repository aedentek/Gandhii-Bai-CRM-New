const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function migrateCallRecordsToDatabase() {
  let connection;
  
  try {
    console.log('🔄 Starting migration of patient call records from JSON to MySQL...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Read JSON data
    const jsonPath = path.join(__dirname, 'server/routes/data/patientCallRecords.json');
    const jsonData = await fs.readFile(jsonPath, 'utf8');
    const callRecords = JSON.parse(jsonData);
    
    console.log(`📄 Found ${callRecords.length} call records in JSON file`);
    
    // Clear existing data in database table (if any)
    await connection.execute('DELETE FROM patient_call_records');
    console.log('🗑️ Cleared existing data from patient_call_records table');
    
    // Insert each record into database
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of callRecords) {
      try {
        // Convert createdAt to MySQL datetime format
        const createdAt = new Date(record.createdAt).toISOString().slice(0, 19).replace('T', ' ');
        
        await connection.execute(`
          INSERT INTO patient_call_records (
            id, patient_id, patient_name, date, description, 
            audio_file_path, audio_file_name, audio_duration, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.id,
          record.patient_id,
          record.patient_name,
          record.date,
          record.description || '',
          record.audio_file_path,
          record.audio_file_name,
          record.audio_duration || 0,
          createdAt
        ]);
        
        successCount++;
        console.log(`✅ Migrated record: ${record.id} (${record.patient_name})`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate record ${record.id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${successCount} records`);
    console.log(`❌ Failed migrations: ${errorCount} records`);
    
    // Verify the migration
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM patient_call_records');
    console.log(`🔍 Database now contains: ${rows[0].count} call records`);
    
    // Backup the JSON file
    const backupPath = path.join(__dirname, 'server/routes/data/patientCallRecords.json.backup');
    await fs.copyFile(jsonPath, backupPath);
    console.log(`💾 JSON file backed up to: ${backupPath}`);
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
migrateCallRecordsToDatabase();
