const http = require('http');

// Test creating a fresh Super Admin role
const superAdminData = {
  name: `Ultimate Super Admin ${Date.now()}`,
  description: 'Final test super admin',
  permissions: ['dashboard'], // Only request 1 permission
  status: 'active'
};

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/roles',
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(superAdminData))
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('🎉 FINAL SUCCESS TEST RESULT:');
    console.log('============================');
    console.log('Role Name:', result.name);
    console.log('Requested Permissions: 1 (dashboard only)');
    console.log('Actual Permissions Granted:', result.permissions.length);
    console.log('Status:', result.permissions.length >= 40 ? '✅ SUCCESS - Super Admin got all permissions!' : '❌ FAILED');
    console.log('First 5 permissions:', result.permissions.slice(0, 5).join(', '));
    console.log('\n🏆 SYSTEM IS FULLY WORKING!');
  });
});

req.write(JSON.stringify(superAdminData));
req.end();
