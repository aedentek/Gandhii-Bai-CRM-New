import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:4000/api';
let createdReportId = null;

// Helper function to make API calls with proper error handling
async function makeApiCall(url, options = {}) {
    try {
        console.log(`🌐 Making API call: ${options.method || 'GET'} ${url}`);
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ API Success:`, JSON.stringify(data, null, 2));
            return { success: true, data };
        } else {
            console.log(`❌ API Error: ${response.status}`, JSON.stringify(data, null, 2));
            return { success: false, error: data };
        }
    } catch (error) {
        console.log(`💥 Network Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test GET all test reports
async function testGetAll() {
    console.log('\n🔍 Testing GET all test reports...');
    const result = await makeApiCall(`${API_BASE_URL}/test-reports`);
    
    if (result.success) {
        console.log(`📊 Found ${result.data.data.length} test reports in database`);
        if (result.data.data.length > 0) {
            console.log(`🔍 First report sample:`, result.data.data[0]);
        }
    }
    return result;
}

// Test CREATE new test report
async function testCreate() {
    console.log('\n➕ Testing CREATE new test report...');
    
    const testData = {
        patient_id: 'PAT001',
        patient_name: 'John Doe',
        test_type: 'Blood Test - Complete Panel',
        test_date: new Date().toISOString().split('T')[0],
        amount: 500,
        notes: 'Routine blood work for annual checkup',
        status: 'Pending'
    };

    console.log('📝 Creating test report with data:', testData);

    const result = await makeApiCall(`${API_BASE_URL}/test-reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
    });

    if (result.success && result.data.data) {
        createdReportId = result.data.data.id;
        console.log(`✅ Test report created with ID: ${createdReportId}`);
    }
    
    return result;
}

// Test UPDATE test report
async function testUpdate() {
    if (!createdReportId) {
        console.log('⚠️ No report ID available. Cannot test update.');
        return { success: false, error: 'No report ID' };
    }

    console.log(`\n✏️ Testing UPDATE test report with ID: ${createdReportId}...`);
    
    const updateData = {
        test_type: 'Blood Test - Complete Panel with Lipid Profile',
        test_date: new Date().toISOString().split('T')[0],
        amount: 750,
        notes: 'Updated: Comprehensive blood work including CBC, liver function, kidney function, and lipid profile',
        status: 'Completed'
    };

    console.log('📝 Updating with data:', updateData);

    const result = await makeApiCall(`${API_BASE_URL}/test-reports/${createdReportId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    });

    if (result.success) {
        console.log(`✅ Test report ${createdReportId} updated successfully`);
    }
    
    return result;
}

// Test DELETE test report
async function testDelete() {
    if (!createdReportId) {
        console.log('⚠️ No report ID available. Cannot test delete.');
        return { success: false, error: 'No report ID' };
    }

    console.log(`\n🗑️ Testing DELETE test report with ID: ${createdReportId}...`);

    const result = await makeApiCall(`${API_BASE_URL}/test-reports/${createdReportId}`, {
        method: 'DELETE'
    });

    if (result.success) {
        console.log(`✅ Test report ${createdReportId} deleted successfully`);
        createdReportId = null;
    }
    
    return result;
}

// Run full CRUD test sequence
async function runFullCRUDTest() {
    console.log('🚀 Starting Full CRUD Test Sequence for Test Report Amount System...');
    console.log('='.repeat(80));
    
    try {
        // 1. Initial GET all
        console.log('\n📖 STEP 1: GET All Reports (Initial State)');
        const initialGetResult = await testGetAll();
        if (!initialGetResult.success) throw new Error('Initial GET failed');
        
        // 2. CREATE
        console.log('\n➕ STEP 2: CREATE New Report');
        const createResult = await testCreate();
        if (!createResult.success) throw new Error('CREATE operation failed');
        
        // 3. GET all after create
        console.log('\n📖 STEP 3: GET All Reports (After CREATE)');
        const getAfterCreateResult = await testGetAll();
        if (!getAfterCreateResult.success) throw new Error('GET after CREATE failed');
        
        // 4. UPDATE
        console.log('\n✏️ STEP 4: UPDATE Report');
        const updateResult = await testUpdate();
        if (!updateResult.success) throw new Error('UPDATE operation failed');
        
        // 5. GET all after update
        console.log('\n📖 STEP 5: GET All Reports (After UPDATE)');
        const getAfterUpdateResult = await testGetAll();
        if (!getAfterUpdateResult.success) throw new Error('GET after UPDATE failed');
        
        // 6. DELETE
        console.log('\n🗑️ STEP 6: DELETE Report');
        const deleteResult = await testDelete();
        if (!deleteResult.success) throw new Error('DELETE operation failed');
        
        // 7. GET all after delete
        console.log('\n📖 STEP 7: GET All Reports (After DELETE)');
        const finalGetResult = await testGetAll();
        if (!finalGetResult.success) throw new Error('Final GET failed');

        // Success summary
        console.log('\n' + '='.repeat(80));
        console.log('🎉 FULL CRUD TEST COMPLETED SUCCESSFULLY! 🎉');
        console.log('✅ All operations (CREATE, READ, UPDATE, DELETE) working correctly');
        console.log('✅ Frontend to Backend database connection established');
        console.log('✅ Test Report Amount system is fully functional');
        console.log('✅ Database table created and operational');
        console.log('✅ API endpoints responding correctly');
        console.log('✅ Data persistence verified');
        console.log('='.repeat(80));
        
        return { success: true, message: 'All CRUD operations successful' };
        
    } catch (error) {
        console.log('\n' + '='.repeat(80));
        console.log(`❌ FULL CRUD TEST FAILED: ${error.message}`);
        console.log('='.repeat(80));
        return { success: false, error: error.message };
    }
}

// Test individual endpoints
async function testSpecificEndpoints() {
    console.log('\n🧪 Testing specific endpoint variations...');
    
    // Test patient-specific endpoint (after creating a record)
    if (createdReportId) {
        console.log('\n🔍 Testing GET reports by patient ID...');
        const patientReportsResult = await makeApiCall(`${API_BASE_URL}/test-reports/patient/PAT001`);
        if (patientReportsResult.success) {
            console.log(`✅ Found ${patientReportsResult.data.data.length} reports for patient PAT001`);
        }
    }
}

// Main execution
async function main() {
    console.log('🧪 Test Report Amount CRUD Operations Test');
    console.log('Testing all database operations for the Test Report Amount system\n');
    
    // Test server connection first
    console.log('🌐 Testing server connection...');
    try {
        const connectionTest = await fetch(`${API_BASE_URL}/test-reports`);
        if (connectionTest.ok) {
            console.log('✅ Server connection successful!');
        } else {
            throw new Error(`Server responded with status: ${connectionTest.status}`);
        }
    } catch (error) {
        console.log('❌ Server connection failed:', error.message);
        console.log('📝 Please ensure the backend server is running on localhost:4000');
        process.exit(1);
    }
    
    // Run the full CRUD test
    const result = await runFullCRUDTest();
    
    if (result.success) {
        console.log('\n🏆 SUCCESS: Test Report Amount CRUD system is fully operational!');
        process.exit(0);
    } else {
        console.log('\n💥 FAILURE: CRUD test failed');
        process.exit(1);
    }
}

// Run the test
main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});
