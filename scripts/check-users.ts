import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🗄️  Connected to database\n');

    // Get users
    const users = await client.query('SELECT id, email, full_name FROM users ORDER BY id');
    console.log(`👥 Total users: ${users.rows.length}\n`);

    users.rows.forEach(user => {
      console.log(`  - ID ${user.id}: ${user.full_name} (${user.email})`);
    });

    // Get employees
    const employees = await client.query('SELECT id, name, user_id FROM employees ORDER BY id');
    console.log(`\n👤 Total employees: ${employees.rows.length}\n`);

    employees.rows.forEach(emp => {
      console.log(`  - ID ${emp.id}: ${emp.name} (user_id: ${emp.user_id || 'NULL'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkUsers();
