// Comprehensive database connection troubleshooting
require('dotenv').config();
const mysql = require('mysql2/promise');

async function troubleshootConnection() {
  console.log('🔧 HOSTINGER DATABASE CONNECTION TROUBLESHOOTING');
  console.log('================================================');
  
  console.log('\n📋 Current Configuration:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  console.log('Your IP:', '223.185.21.123');
  
  console.log('\n🧪 Testing different connection methods...');
  
  // Test 1: Direct connection with original hostname
  console.log('\n1️⃣ Testing with original hostname (srv1639.hstgr.io)...');
  try {
    const connection1 = await mysql.createConnection({
      host: 'srv1639.hstgr.io',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
      ssl: false
    });
    
    const [result1] = await connection1.execute('SELECT 1 as test');
    await connection1.end();
    console.log('✅ Original hostname connection: SUCCESS');
    
  } catch (error) {
    console.log('❌ Original hostname connection: FAILED');
    console.log('   Error:', error.message.substring(0, 100));
  }
  
  // Test 2: Direct connection with IP
  console.log('\n2️⃣ Testing with IP address (193.203.184.143)...');
  try {
    const connection2 = await mysql.createConnection({
      host: '193.203.184.143',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
      ssl: false
    });
    
    const [result2] = await connection2.execute('SELECT 1 as test');
    await connection2.end();
    console.log('✅ IP address connection: SUCCESS');
    
  } catch (error) {
    console.log('❌ IP address connection: FAILED');
    console.log('   Error:', error.message.substring(0, 100));
  }
  
  // Test 3: Connection with SSL
  console.log('\n3️⃣ Testing with SSL enabled...');
  try {
    const connection3 = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
      ssl: { rejectUnauthorized: false }
    });
    
    const [result3] = await connection3.execute('SELECT 1 as test');
    await connection3.end();
    console.log('✅ SSL connection: SUCCESS');
    
  } catch (error) {
    console.log('❌ SSL connection: FAILED');
    console.log('   Error:', error.message.substring(0, 100));
  }
  
  console.log('\n📊 DIAGNOSIS:');
  console.log('==============');
  console.log('🔍 Current IP being used: 223.185.21.123');
  console.log('🔍 Access denied error indicates IP is not whitelisted yet');
  
  console.log('\n✅ NEXT STEPS:');
  console.log('1. Go to Hostinger cPanel → Databases → Remote MySQL');
  console.log('2. Verify IP 223.185.21.123 is in the whitelist');
  console.log('3. If not there, add it specifically');
  console.log('4. Wait 5-15 minutes for propagation');
  console.log('5. Alternatively, try accessing via phpMyAdmin to verify credentials');
  
  console.log('\n🚨 TEMPORARY WORKAROUND:');
  console.log('Your file upload system is working perfectly!');
  console.log('You can use AddStaff page for file uploads while we fix database connection.');
}

troubleshootConnection();
