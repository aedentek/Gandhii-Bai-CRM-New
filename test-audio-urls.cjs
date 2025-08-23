// Test audio URL construction and accessibility
const testAudioUrls = [
  'Photos/Patient History/111/audio/1755756672759-Test-audio family record.mp3',
  'Photos/Patient History/101/audio/1755428964370-Test-audio family record.mp3',
  'Photos/Patient History/102/audio/1755431863913-Test-audio family record.mp3'
];

async function testAudioFiles() {
  console.log('🎵 Testing audio file accessibility...');
  
  for (const filePath of testAudioUrls) {
    const url = `http://localhost:4000/${filePath}`;
    
    try {
      console.log(`\n🔗 Testing: ${url}`);
      
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);
      } else {
        console.log(`❌ Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${url}:`, error.message);
    }
  }
}

// Run the test
testAudioFiles();
