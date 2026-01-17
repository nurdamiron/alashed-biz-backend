import * as dotenv from 'dotenv';

dotenv.config();

async function testAPI() {
  const baseURL = 'http://localhost:3000/api';

  // Login first
  const loginResponse = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@admin.com',
      password: 'admin123',
    }),
  });

  if (!loginResponse.ok) {
    console.error('Login failed:', await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json();
  const token = loginData.accessToken;
  console.log('✅ Logged in successfully\n');

  // Get tasks
  const tasksResponse = await fetch(`${baseURL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const tasksData = await tasksResponse.json();
  console.log('📋 Tasks count:', tasksData.tasks.length);
  console.log('\n🔍 First task:');
  console.log(JSON.stringify(tasksData.tasks[0], null, 2));

  console.log('\n📊 Status values:');
  const statuses = [...new Set(tasksData.tasks.map((t: any) => t.status))];
  console.log('  ', statuses);

  console.log('\n📊 Priority values:');
  const priorities = [...new Set(tasksData.tasks.map((t: any) => t.priority))];
  console.log('  ', priorities);
}

testAPI();
