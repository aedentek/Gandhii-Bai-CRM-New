const http = require('http');

const req = http.request({
  hostname: 'localhost', 
  port: 4000, 
  path: '/api/roles', 
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const roles = JSON.parse(data);
    console.log('📋 Roles with permissions from API:');
    roles.forEach(role => {
      console.log(`ID: ${role.id}, Name: "${role.name}"`);
      console.log(`   Permissions type: ${typeof role.permissions}`);
      console.log(`   Permissions value: ${JSON.stringify(role.permissions)}`);
      console.log('');
    });
  });
});
req.end();
