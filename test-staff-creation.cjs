// Test script to verify staff creation with proper date format and category_id
const mysql = require('mysql2/promise');

async function testStaffCreation() {
  const connection = await mysql.createConnection({
    host: 'srv1639.hstgr.io',
    user: 'u745362362_crmusername',
    password: 'Aedentek@123#',
    database: 'u745362362_crm'
  });

  try {
    console.log('🔍 Testing staff creation with proper date format and category_id...');
    
    // First, get a category ID
    const [categories] = await connection.query('SELECT * FROM staff_categories WHERE status = "active" LIMIT 1');
    const categoryId = categories.length > 0 ? categories[0].id : null;
    
    console.log('📋 Available category:', categories[0]);
    
    // Test data
    const testStaff = {
      id: 'STF999',
      name: 'Test Staff Member',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address',
      role: categories[0]?.name || 'Test',
      category_id: categoryId,
      department: 'Test Department',
      join_date: '2025-08-22', // MySQL DATE format
      salary: 25000,
      status: 'Active',
      photo: '',
      documents: '{}'
    };

    // Insert test staff
    await connection.query(
      'INSERT INTO staff (id, name, email, phone, address, role, category_id, department, join_date, salary, status, photo, documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), category_id = VALUES(category_id), join_date = VALUES(join_date)',
      [testStaff.id, testStaff.name, testStaff.email, testStaff.phone, testStaff.address, testStaff.role, testStaff.category_id, testStaff.department, testStaff.join_date, testStaff.salary, testStaff.status, testStaff.photo, testStaff.documents]
    );

    console.log('✅ Test staff created successfully');

    // Verify the insertion
    const [result] = await connection.query('SELECT id, name, role, category_id, join_date FROM staff WHERE id = ?', [testStaff.id]);
    console.log('📊 Inserted staff data:', result[0]);
    
    // Clean up test data
    await connection.query('DELETE FROM staff WHERE id = ?', [testStaff.id]);
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await connection.end();
  }
}

testStaffCreation();
