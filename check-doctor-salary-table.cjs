const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'srv1106.hstgr.io',
  user: 'u745362362_crm',
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
});

connection.connect((err) => {
  if (err) {
    console.error('Connection failed:', err);
    return;
  }
  console.log('Connected to database');

  // Check table structure
  connection.query('DESCRIBE doctor_salary_settlements', (err, results) => {
    if (err) {
      console.error('Error describing table:', err);
    } else {
      console.log('Table structure for doctor_salary_settlements:');
      console.table(results);
      
      // Check if doctor_name column exists
      const doctorNameColumn = results.find(col => col.Field === 'doctor_name');
      console.log('\nDoctor name column exists:', !!doctorNameColumn);
      
      if (doctorNameColumn) {
        console.log('Doctor name column details:', doctorNameColumn);
      }
    }
    
    connection.end();
  });
});
