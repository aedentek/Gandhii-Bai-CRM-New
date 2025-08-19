const mysql = require('mysql2/promise');

async function setupAndTestCRUD() {
  try {
    console.log('🚀 Starting Complete CRUD Test for Doctor Advance');
    console.log('='.repeat(60));
    
    const connection = await mysql.createConnection({
      host: 'srv1639.hstgr.io',
      user: 'u745362362_crmusername',
      password: 'Aedentek@123#',
      database: 'u745362362_crm'
    });

    console.log('✅ Connected to database u745362362_crm');

    // 1. CREATE TABLE
    console.log('\n📋 STEP 1: CREATE TABLE');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS doctor_advance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id VARCHAR(255) NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table created successfully!');

    // 2. CREATE (INSERT) Test
    console.log('\n📝 STEP 2: CREATE - INSERT Test Records');
    const testRecords = [
      {
        doctor_id: 'DOC001',
        doctor_name: 'Dr. Rajesh Kumar',
        date: '2024-08-15',
        amount: 5000.00,
        reason: 'Medical conference advance'
      },
      {
        doctor_id: 'DOC002', 
        doctor_name: 'Dr. Priya Sharma',
        date: '2024-08-18',
        amount: 3500.00,
        reason: 'Equipment purchase advance'
      },
      {
        doctor_id: 'DOC003',
        doctor_name: 'Dr. Amit Singh',
        date: '2024-08-19',
        amount: 7500.00,
        reason: 'Training program advance payment'
      }
    ];

    const insertedIds = [];
    for (const record of testRecords) {
      const [result] = await connection.execute(
        'INSERT INTO doctor_advance (doctor_id, doctor_name, date, amount, reason) VALUES (?, ?, ?, ?, ?)',
        [record.doctor_id, record.doctor_name, record.date, record.amount, record.reason]
      );
      insertedIds.push(result.insertId);
      console.log(`✅ Created: ${record.doctor_name} - ₹${record.amount} (ID: ${result.insertId})`);
    }

    // 3. READ Test
    console.log('\n📖 STEP 3: READ - Fetch All Records');
    const [allRecords] = await connection.execute('SELECT * FROM doctor_advance ORDER BY created_at DESC');
    console.log(`✅ Total records found: ${allRecords.length}`);
    allRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ID:${record.id} - ${record.doctor_name} - ₹${record.amount} (${record.date})`);
    });

    // 4. READ by ID Test
    console.log('\n📖 STEP 4: READ - Fetch Single Record by ID');
    const testId = insertedIds[0];
    const [singleRecord] = await connection.execute('SELECT * FROM doctor_advance WHERE id = ?', [testId]);
    if (singleRecord.length > 0) {
      console.log(`✅ Found record: ${singleRecord[0].doctor_name} - ₹${singleRecord[0].amount}`);
    }

    // 5. UPDATE Test
    console.log('\n✏️  STEP 5: UPDATE - Modify Record');
    const updateId = insertedIds[1];
    const newAmount = 4000.00;
    const newReason = 'Updated: Equipment and conference advance';
    
    await connection.execute(
      'UPDATE doctor_advance SET amount = ?, reason = ? WHERE id = ?',
      [newAmount, newReason, updateId]
    );
    
    const [updatedRecord] = await connection.execute('SELECT * FROM doctor_advance WHERE id = ?', [updateId]);
    console.log(`✅ Updated record ID ${updateId}: ${updatedRecord[0].doctor_name} - ₹${updatedRecord[0].amount}`);
    console.log(`   New reason: ${updatedRecord[0].reason}`);

    // 6. DELETE Test
    console.log('\n🗑️  STEP 6: DELETE - Remove Record');
    const deleteId = insertedIds[2];
    const [recordToDelete] = await connection.execute('SELECT doctor_name FROM doctor_advance WHERE id = ?', [deleteId]);
    
    await connection.execute('DELETE FROM doctor_advance WHERE id = ?', [deleteId]);
    console.log(`✅ Deleted record ID ${deleteId}: ${recordToDelete[0].doctor_name}`);

    // 7. Final Verification
    console.log('\n🔍 STEP 7: FINAL VERIFICATION');
    const [finalRecords] = await connection.execute('SELECT * FROM doctor_advance ORDER BY created_at DESC');
    console.log(`✅ Final count: ${finalRecords.length} records remaining`);
    finalRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ID:${record.id} - ${record.doctor_name} - ₹${record.amount}`);
    });

    await connection.end();
    
    console.log('\n🎉 CRUD TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('✅ CREATE: 3 records inserted');
    console.log('✅ READ: All records and single record fetched');
    console.log('✅ UPDATE: 1 record modified');
    console.log('✅ DELETE: 1 record removed');
    console.log(`✅ FINAL STATE: ${finalRecords.length} records in database`);
    
  } catch (error) {
    console.error('❌ CRUD Test Error:', error);
  }
}

setupAndTestCRUD();
