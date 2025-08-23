import { DatabaseService } from './src/services/databaseService.js';
import { getFileUrl } from './src/services/simpleFileUpload.js';

console.log('🔍 Testing audio playback data flow...');

async function testAudioDataFlow() {
  try {
    // Get all patient history records from database
    console.log('📊 Fetching patient history records...');
    const records = await DatabaseService.getAllPatientHistory();
    
    console.log(`\n📋 Found ${records.length} total records`);
    
    // Filter records that have audio data
    const audioRecords = records.filter(record => 
      record.audio_recording || 
      record.audio_file_name || 
      (record.documents_info && record.documents_info.includes('audio'))
    );
    
    console.log(`🎵 Found ${audioRecords.length} records with audio data:`);
    
    audioRecords.forEach((record, index) => {
      console.log(`\n🎵 Audio Record ${index + 1}:`);
      console.log(`  Record ID: ${record.id}`);
      console.log(`  Patient ID: ${record.patient_id}`);
      console.log(`  Patient Name: ${record.patient_name}`);
      console.log(`  Audio Recording Path: ${record.audio_recording}`);
      console.log(`  Audio File Name: ${record.audio_file_name}`);
      
      if (record.audio_recording) {
        const audioUrl = getFileUrl(record.audio_recording);
        console.log(`  🔗 Generated Audio URL: ${audioUrl}`);
      }
      
      if (record.documents_info) {
        try {
          let jsonString = record.documents_info;
          
          // Handle double-encoded JSON
          if (typeof jsonString === 'string' && jsonString.startsWith('"') && jsonString.endsWith('"')) {
            jsonString = jsonString.slice(1, -1);
            jsonString = jsonString.replace(/\\"/g, '"');
          }
          
          const parsed = JSON.parse(jsonString);
          console.log(`  📋 Documents Info:`, parsed);
          
          // Check if there are audio files in documents_info
          if (Array.isArray(parsed)) {
            const audioFiles = parsed.filter(item => item && item.type && item.type.startsWith('audio/'));
            if (audioFiles.length > 0) {
              console.log(`  🎵 Audio files in documents_info:`, audioFiles);
            }
          }
        } catch (error) {
          console.log(`  ❌ Error parsing documents_info:`, error.message);
        }
      }
    });
    
    if (audioRecords.length === 0) {
      console.log('\n❌ No audio records found in database!');
      console.log('💡 This might be why audio is not playing.');
    }
    
  } catch (error) {
    console.error('❌ Error testing audio data flow:', error);
  }
}

testAudioDataFlow();
