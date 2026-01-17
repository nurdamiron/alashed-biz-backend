import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkTasks() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🗄️  Connected to database\n');

    // Получить все задачи с информацией о сотрудниках
    const result = await client.query(`
      SELECT
        t.id,
        t.title,
        t.priority,
        t.status,
        t.deadline,
        e.name as assignee_name,
        e.id as assignee_id
      FROM tasks t
      LEFT JOIN employees e ON t.assignee_id = e.id
      ORDER BY
        CASE t.priority
          WHEN 'Высокий' THEN 1
          WHEN 'Средний' THEN 2
          WHEN 'Низкий' THEN 3
        END,
        e.name
    `);

    console.log(`📋 Total tasks: ${result.rows.length}\n`);

    // Группируем по сотрудникам
    const tasksByEmployee: Record<string, any[]> = {};

    result.rows.forEach(task => {
      const employeeName = task.assignee_name || 'Не назначено';
      if (!tasksByEmployee[employeeName]) {
        tasksByEmployee[employeeName] = [];
      }
      tasksByEmployee[employeeName].push(task);
    });

    // Показываем задачи по сотрудникам
    Object.entries(tasksByEmployee).forEach(([employee, tasks]) => {
      console.log(`\n👤 ${employee} (${tasks.length} задач):`);
      console.log('─'.repeat(60));

      tasks.forEach(task => {
        const priorityIcon = task.priority === 'Высокий' ? '🔴' : task.priority === 'Средний' ? '🟡' : '🟢';
        const statusIcon = task.status === 'Готово' ? '✅' : task.status === 'В процессе' ? '🔄' : '⏳';
        const deadline = task.deadline ? ` 📅 ${new Date(task.deadline).toLocaleDateString('ru-RU')}` : '';

        console.log(`  ${priorityIcon} ${statusIcon} ${task.title}${deadline}`);
      });
    });

    // Статистика по приоритетам
    console.log('\n\n📊 Статистика по приоритетам:');
    console.log('─'.repeat(60));
    const stats = await client.query(`
      SELECT
        priority,
        status,
        COUNT(*) as count
      FROM tasks
      GROUP BY priority, status
      ORDER BY
        CASE priority
          WHEN 'Высокий' THEN 1
          WHEN 'Средний' THEN 2
          WHEN 'Низкий' THEN 3
        END,
        status
    `);

    stats.rows.forEach(row => {
      const icon = row.priority === 'Высокий' ? '🔴' : row.priority === 'Средний' ? '🟡' : '🟢';
      console.log(`  ${icon} ${row.priority} - ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkTasks();
