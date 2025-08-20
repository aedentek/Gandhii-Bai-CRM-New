const mysql = require('mysql2/promise');

async function setupComprehensiveCarryForward() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    console.log('🔄 Setting up comprehensive carry forward data...');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get all active doctors
    const [doctors] = await connection.execute(`
      SELECT id, name, salary 
      FROM doctors 
      WHERE status = 'Active' 
      ORDER BY name
    `);
    
    console.log(`Found ${doctors.length} active doctors`);
    
    for (const doctor of doctors) {
      const baseSalary = parseFloat(doctor.salary) || 25000;
      
      // Generate random carry forward between 1000-8000
      const carryForwardAmount = Math.floor(Math.random() * 7000) + 1000;
      
      const totalDue = baseSalary + carryForwardAmount;
      
      // Insert/update monthly salary record with carry forward
      await connection.execute(`
        INSERT INTO doctor_monthly_salary 
        (doctor_id, month, year, base_salary, carry_forward_from_previous, total_due, total_paid, balance, status)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'Pending')
        ON DUPLICATE KEY UPDATE
          base_salary = VALUES(base_salary),
          carry_forward_from_previous = VALUES(carry_forward_from_previous),
          total_due = VALUES(total_due),
          balance = VALUES(balance)
      `, [doctor.id, currentMonth, currentYear, baseSalary, carryForwardAmount, totalDue, totalDue]);
      
      console.log(`✅ ${doctor.name}: Base ₹${baseSalary.toLocaleString()}, Carry Forward ₹${carryForwardAmount.toLocaleString()}`);
    }
    
    // Summary
    const [summary] = await connection.execute(`
      SELECT 
        COUNT(*) as total_doctors,
        SUM(base_salary) as total_base_salary,
        SUM(carry_forward_from_previous) as total_carry_forward,
        SUM(total_due) as total_amount_due
      FROM doctor_monthly_salary 
      WHERE month = ? AND year = ?
    `, [currentMonth, currentYear]);
    
    console.log('\n📊 SUMMARY FOR', `${currentMonth}/${currentYear}:`);
    console.log(`Total Doctors: ${summary[0].total_doctors}`);
    console.log(`Total Base Salary: ₹${parseFloat(summary[0].total_base_salary || 0).toLocaleString()}`);
    console.log(`Total Carry Forward: ₹${parseFloat(summary[0].total_carry_forward || 0).toLocaleString()}`);
    console.log(`Total Amount Due: ₹${parseFloat(summary[0].total_amount_due || 0).toLocaleString()}`);
    
    console.log('\n🎉 Carry forward setup completed! Check the Doctor Salary page now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

setupComprehensiveCarryForward();
