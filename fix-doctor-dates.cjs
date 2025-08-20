const mysql = require('mysql2/promise');

async function fixDoctorDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    console.log('🔍 Checking all doctor join_date values...');
    
    // First, let's see what we have
    const [doctors] = await connection.execute('SELECT id, name, join_date FROM doctors ORDER BY id');
    
    console.log('\nCurrent doctor records:');
    doctors.forEach(doctor => {
      console.log(`ID: ${doctor.id}, Name: ${doctor.name}`);
      console.log(`  join_date: ${doctor.join_date}`);
      console.log(`  Type: ${typeof doctor.join_date}`);
      console.log(`  Is NULL: ${doctor.join_date === null}`);
      console.log(`  Is undefined: ${doctor.join_date === undefined}`);
      console.log(`  Value: ${JSON.stringify(doctor.join_date)}`);
      console.log('---');
    });

    // Find doctors with NULL or invalid dates
    const [problematic] = await connection.execute(`
      SELECT id, name, join_date 
      FROM doctors 
      WHERE join_date IS NULL 
         OR join_date = '' 
         OR join_date = '0000-00-00'
         OR join_date = '1970-01-01'
    `);

    if (problematic.length > 0) {
      console.log(`\n🚨 Found ${problematic.length} doctors with invalid dates:`);
      problematic.forEach(doctor => {
        console.log(`  - ${doctor.name} (ID: ${doctor.id}): ${doctor.join_date}`);
      });

      // Fix them by setting a default date
      const defaultDate = '01-06-2023'; // DD-MM-YYYY format for database
      for (const doctor of problematic) {
        await connection.execute(
          'UPDATE doctors SET join_date = ? WHERE id = ?',
          [defaultDate, doctor.id]
        );
        console.log(`✅ Fixed ${doctor.name} - set join_date to ${defaultDate}`);
      }
    } else {
      console.log('\n✅ All doctors have valid join_date values');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

fixDoctorDates();
