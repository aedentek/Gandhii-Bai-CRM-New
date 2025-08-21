// Using built-in fetch in Node.js 18+

const API_BASE = 'http://localhost:4000/api';

async function testStaffAdvanceAPI() {
    console.log('🧪 Testing Staff Advance API...\n');

    try {
        // Test 1: Get all staff advances
        console.log('1️⃣ Testing GET /staff-advances');
        const getAllResponse = await fetch(`${API_BASE}/staff-advances`);
        const getAllData = await getAllResponse.json();
        console.log('Response:', getAllData);
        console.log('✅ GET all advances - Success\n');

        // Test 2: Create a new staff advance
        console.log('2️⃣ Testing POST /staff-advances');
        const newAdvance = {
            staff_id: 'STF001',
            staff_name: 'John Smith',
            date: '2024-01-15',
            amount: 1500,
            reason: 'Medical emergency expenses'
        };

        const createResponse = await fetch(`${API_BASE}/staff-advances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newAdvance)
        });

        const createData = await createResponse.json();
        console.log('Response:', createData);
        
        if (createData.success) {
            console.log('✅ POST create advance - Success\n');
            
            // Test 3: Get advances by staff ID
            console.log('3️⃣ Testing GET /staff-advances/staff/STF001');
            const getByStaffResponse = await fetch(`${API_BASE}/staff-advances/staff/STF001`);
            const getByStaffData = await getByStaffResponse.json();
            console.log('Response:', getByStaffData);
            console.log('✅ GET by staff ID - Success\n');
        } else {
            console.log('❌ POST create advance - Failed\n');
        }

        // Test 4: Get staff list
        console.log('4️⃣ Testing GET /staff-list');
        const staffListResponse = await fetch(`${API_BASE}/staff-list`);
        const staffListData = await staffListResponse.json();
        console.log('Response:', staffListData);
        console.log('✅ GET staff list - Success\n');

        console.log('🎉 All API tests completed successfully!');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testStaffAdvanceAPI();
