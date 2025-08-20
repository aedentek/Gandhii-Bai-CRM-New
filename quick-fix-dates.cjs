const mysql = require('mysql2/promise');

async function quickFixDoctorDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    // Update any doctors with NULL join_date to a valid date
    const [result] = await connection.execute(`
      UPDATE doctors 
      SET join_date = '01-06-2023' 
      WHERE join_date IS NULL OR join_date = '' OR join_date = '0000-00-00'
    `);
    
    console.log(`Updated ${result.affectedRows} doctor records`);
    
    // Verify the fix
    const [doctors] = await connection.execute('SELECT id, name, join_date FROM doctors');
    console.log('All doctors now have dates:');
    doctors.forEach(d => console.log(`${d.name}: ${d.join_date}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

quickFixDoctorDates();
