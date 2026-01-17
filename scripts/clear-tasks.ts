import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function clearTasks() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🗄️  Connected to database');

    // Удалить все задачи
    const result = await client.query('DELETE FROM tasks');
    console.log(`✅ Deleted ${result.rowCount} tasks`);

    // Показать текущих сотрудников
    const employees = await client.query('SELECT id, name, role FROM employees ORDER BY id');
    console.log('\n👥 Current employees:');
    employees.rows.forEach(emp => {
      console.log(`  - ID ${emp.id}: ${emp.name} (${emp.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

clearTasks();
