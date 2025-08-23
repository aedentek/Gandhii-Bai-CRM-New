import { DatabaseService } from './src/services/databaseService.js';

console.log('Checking database service...');

async function checkProducts() {
  try {
    console.log('Calling getAllGeneralProducts...');
    const data = await DatabaseService.getAllGeneralProducts();
    console.log('getAllGeneralProducts result:', data);
    console.log('Product count:', data ? data.length : 'undefined');
    
    if (data && data.length > 0) {
      console.log('First product:', data[0]);
    } else {
      console.log('No products found in database');
      
      // Let's also check if the table exists
      console.log('Checking if general_products table exists...');
      const tables = await DatabaseService.query('SHOW TABLES LIKE "general_products"');
      console.log('Table check result:', tables);
      
      if (tables && tables.length > 0) {
        console.log('Table exists, checking structure...');
        const structure = await DatabaseService.query('DESCRIBE general_products');
        console.log('Table structure:', structure);
        
        const count = await DatabaseService.query('SELECT COUNT(*) as count FROM general_products');
        console.log('Total rows in general_products:', count);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

checkProducts();
