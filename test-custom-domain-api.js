#!/usr/bin/env node

/**
 * Custom Domain API Test Script
 * Tests API endpoints on crm.gandhibaideaddictioncenter.com
 */

console.log('🧪 Testing Custom Domain API Endpoints...');
console.log('🌐 Domain: crm.gandhibaideaddictioncenter.com');
console.log('📅 Test Date:', new Date().toISOString());

const API_BASE = 'https://crm.gandhibaideaddictioncenter.com/api';

async function testEndpoint(path, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`📡 URL: ${API_BASE}${path}`);
    
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = JSON.parse(text);
      console.log(`✅ JSON Response:`, data);
      return { success: true, data };
    } else {
      console.log(`⚠️ Non-JSON Response (first 200 chars):`, text.substring(0, 200));
      return { success: false, error: 'Non-JSON response' };
    }
    
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n🎯 Starting API Tests...\n');
  
  const tests = [
    { path: '/test', description: 'Basic Test Endpoint' },
    { path: '/patients', description: 'Patients List' },
    { path: '/doctors', description: 'Doctors List' },
    { path: '/health', description: 'Health Check' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.path, test.description);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n📈 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Custom domain API is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
