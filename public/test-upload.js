// Simple test to check if upload endpoint is accessible
async function testUploadEndpoint() {
    try {
        console.log('🧪 Testing upload endpoint accessibility...');
        
        // Test the health endpoint first
        const healthResponse = await fetch(`${window.location.protocol}//${window.location.hostname}:4001/api/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health endpoint working:', healthData);
        } else {
            console.log('❌ Health endpoint failed:', healthResponse.status);
            return;
        }
        
        // Test if upload endpoint exists (should return 400 for no file)
        const uploadResponse = await fetch(`${window.location.protocol}//${window.location.hostname}:4001/api/upload-patient-file`, {
            method: 'POST',
            body: new FormData() // Empty form data
        });
        
        console.log('📤 Upload endpoint response status:', uploadResponse.status);
        const uploadResult = await uploadResponse.text();
        console.log('📄 Upload endpoint response:', uploadResult);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test when page loads
testUploadEndpoint();
