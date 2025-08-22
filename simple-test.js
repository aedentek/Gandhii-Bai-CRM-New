// Simple patient API test
import fetch from 'node-fetch';

console.log('Testing patient API...');

async function test() {
  try {
    const response = await fetch('http://localhost:4000/api/health');
    const result = await response.json();
    console.log('Health check result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
