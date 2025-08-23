const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.db');
console.log('🔍 Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT 
    id, 
    patient_id, 
    patient_name, 
    audio_recording, 
    audio_file_name, 
    documents_info 
  FROM patient_history 
  WHERE audio_recording IS NOT NULL 
     OR audio_file_name IS NOT NULL 
     OR (documents_info IS NOT NULL AND documents_info LIKE '%audio%')
  ORDER BY created_at DESC 
  LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('❌ Database error:', err);
    return;
  }
  
  console.log(`\n📊 Found ${rows.length} records with audio data:`);
  
  rows.forEach((row, index) => {
    console.log(`\n🎵 Record ${index + 1}:`);
    console.log(`  ID: ${row.id}`);
    console.log(`  Patient ID: ${row.patient_id}`);
    console.log(`  Patient Name: ${row.patient_name}`);
    console.log(`  Audio Recording: ${row.audio_recording}`);
    console.log(`  Audio File Name: ${row.audio_file_name}`);
    console.log(`  Documents Info: ${row.documents_info ? row.documents_info.substring(0, 200) + '...' : 'null'}`);
  });
  
  db.close();
});
