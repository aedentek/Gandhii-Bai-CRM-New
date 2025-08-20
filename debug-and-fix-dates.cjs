const mysql = require('mysql2/promise');

async function showAndFixDoctorDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    console.log('=== DOCTOR DATES ANALYSIS ===\n');
    
    // Show all doctors and their dates
    const [doctors] = await connection.execute('SELECT id, name, join_date FROM doctors ORDER BY id');
    
    console.log('Current doctor records:');
    doctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.name} (${doctor.id})`);
      console.log(`   join_date: ${doctor.join_date}`);
      console.log(`   is null: ${doctor.join_date === null}`);
      console.log(`   type: ${typeof doctor.join_date}`);
    });

    // Count problematic dates
    const [nullCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM doctors 
      WHERE join_date IS NULL OR join_date = '' OR join_date = '0000-00-00'
    `);

    console.log(`\nFound ${nullCount[0].count} doctors with NULL/invalid dates`);

    if (nullCount[0].count > 0) {
      console.log('\nFixing NULL dates...');
      
      // Set a default date for doctors with NULL join_date
      const result = await connection.execute(`
        UPDATE doctors 
        SET join_date = '01-06-2023' 
        WHERE join_date IS NULL OR join_date = '' OR join_date = '0000-00-00'
      `);

      console.log(`✅ Updated ${result[0].affectedRows} records`);
      
      // Show results after fix
      const [fixedDoctors] = await connection.execute('SELECT id, name, join_date FROM doctors ORDER BY id');
      console.log('\nAfter fix:');
      fixedDoctors.forEach((doctor, index) => {
        console.log(`${index + 1}. ${doctor.name}: ${doctor.join_date}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    console.log('\n=== DONE ===');
  }
}

showAndFixDoctorDates();
