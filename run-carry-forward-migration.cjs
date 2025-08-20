const mysql = require('mysql2/promise');

async function runCarryForwardMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gandhii_bai_crm'
  });

  try {
    console.log('🔄 Starting carry forward migration...');
    
    // Read and execute the migration SQL
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-carry-forward-to-doctor-salary.sql'), 
      'utf8'
    );
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        console.log('Executing:', trimmedStatement.substring(0, 50) + '...');
        await connection.execute(trimmedStatement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the new columns were added
    const [columns] = await connection.execute('DESCRIBE doctor_monthly_salary');
    console.log('\n📊 Updated table structure:');
    columns.forEach(col => console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`));
    
    // Insert some sample carry forward data for testing
    console.log('\n🧪 Adding sample carry forward data...');
    
    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get doctor IDs from the doctors table
    const [doctors] = await connection.execute('SELECT id, name, salary FROM doctors WHERE status = "Active" LIMIT 2');
    
    for (const doctor of doctors) {
      const baseSalary = parseFloat(doctor.salary) || 25000;
      const carryForward = 5000; // Sample carry forward amount
      const totalDue = baseSalary + carryForward;
      
      await connection.execute(`
        INSERT INTO doctor_monthly_salary 
        (doctor_id, month, year, base_salary, carry_forward_from_previous, total_due, total_paid, balance, status)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'Pending')
        ON DUPLICATE KEY UPDATE
        carry_forward_from_previous = VALUES(carry_forward_from_previous),
        base_salary = VALUES(base_salary),
        total_due = VALUES(total_due),
        balance = VALUES(balance)
      `, [doctor.id, currentMonth, currentYear, baseSalary, carryForward, totalDue, totalDue]);
      
      console.log(`✅ Added carry forward data for ${doctor.name}: ₹${carryForward.toLocaleString()}`);
    }
    
    console.log('\n🎉 Carry forward system is now ready!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runCarryForwardMigration();
