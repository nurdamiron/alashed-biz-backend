import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Сначала нужно залогиниться
async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@alashed.kz',
      password: 'admin123'
    })
  });

  const data = await response.json();
  console.log('Login response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(data)}`);
  }

  // API может вернуть accessToken или token
  return data.accessToken || data.token || data.data?.accessToken;
}

// Получить список сотрудников
async function getEmployees(token: string) {
  const response = await fetch(`${API_URL}/staff`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log('Raw staff response:', JSON.stringify(data, null, 2));

  // API может вернуть массив или объект с полем employees
  if (Array.isArray(data)) {
    return data;
  } else if (data.employees && Array.isArray(data.employees)) {
    return data.employees;
  } else {
    throw new Error('Unexpected response format from /staff endpoint');
  }
}

// Создать задачу
async function createTask(token: string, task: any) {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create task: ${error}`);
  }

  return await response.json();
}

// Все задачи по сотрудникам
const tasksByEmployee = {
  'Нурда': [
    {
      title: 'Архитектура Studio Alashed',
      description: 'Разработать схему взаимодействия модулей (AI, Block coding, Python/JS) для учителей и учеников. Цель: Создать масштабируемую базу для платформы. Результат: Утвержденная техническая документация и схема архитектуры.',
      priority: 'Высокий',
      tag: 'разработка'
    },
    {
      title: 'Поднять Blocks и Studio Alashed',
      description: 'Написать код, настроить сервера, запустить рабочие версии инструментов. Цель: Обеспечить работоспособность продукта для пользователей. Результат: Рабочие ссылки, где можно писать код и использовать блоки.',
      priority: 'Высокий',
      tag: 'разработка'
    },
    {
      title: 'Исправить Лендинг',
      description: 'Провести аудит текущего сайта, исправить баги верстки, обновить контент. Цель: Повысить доверие клиентов и конверсию в заявку. Результат: Сайт без ошибок, с актуальной информацией и работающими формами.',
      priority: 'Средний',
      tag: 'веб'
    },
    {
      title: 'Упаковать проектное бюро',
      description: 'Создать страницу или презентацию услуги по аналогии с osn.kz. Цель: Запустить новое направление продаж (услуги, а не только товары). Результат: Опубликованная страница или готовая презентация для отправки клиенту.',
      priority: 'Средний',
      tag: 'бизнес'
    },
    {
      title: 'Astana Hub льготные программы',
      description: 'Изучить условия, собрать документы и подать заявку на участие. Цель: Получить налоговые льготы и статус IT-стартапа. Результат: Поданная заявка или полученный статус участника.',
      priority: 'Средний',
      tag: 'бизнес'
    }
  ],
  'Казбек': [
    {
      title: 'Ревизия товаров',
      description: 'Пересчитать весь физический склад, сверить с базой Satu.kz, удалить несуществующие позиции. Цель: Понимать реальные остатки, чтобы не продавать воздух. Результат: Актуальная Excel-таблица или CRM с точными остатками.',
      priority: 'Высокий',
      tag: 'склад'
    },
    {
      title: 'Магазин на Kaspi',
      description: 'Загрузить товары на маркетплейс, выставить актуальные цены и остатки после ревизии. Цель: Увеличить продажи через самый популярный канал. Результат: Активный магазин на Kaspi с доступными к покупке товарами.',
      priority: 'Высокий',
      tag: 'продажи'
    },
    {
      title: 'Закуп Arduino Uno',
      description: 'Найти поставщика, оплатить и привезти партию базовых плат. Цель: Обеспечить склад самым ходовым компонентом для наборов. Результат: Товар лежит на складе и готов к сборке.',
      priority: 'Средний',
      tag: 'закупки'
    }
  ],
  'Диас': [
    {
      title: 'Авторские права на учебные материалы',
      description: 'Подготовить документы и зарегистрировать права на учебные материалы. Цель: Защитить интеллектуальную собственность от копирования конкурентами. Результат: Полученное свидетельство о регистрации прав.',
      priority: 'Высокий',
      tag: 'юридическое'
    },
    {
      title: 'Сертификат CT KZ (юр. часть)',
      description: 'Собрать юридическую часть документов совместно с Бексом. Цель: Получить доступ к государственным тендерам и закупкам. Результат: Пакет документов готов к подаче.',
      priority: 'Высокий',
      tag: 'сертификация'
    },
    {
      title: 'SEO / Гео-оптимизация',
      description: 'Настроить карточки в 2ГИС, Google Maps, Яндекс, прописать ключевые слова на сайте. Цель: Получать бесплатных клиентов из поиска. Результат: Сайт и компания выходят на первой странице поиска по ключевым запросам.',
      priority: 'Средний',
      tag: 'маркетинг'
    }
  ],
  'Бекс': [
    {
      title: 'Гараж - навести порядок (СРОЧНО)',
      description: 'Вывезти лишние вещи, навести порядок, позвонить хозяину (срок: пара дней). Цель: Решить вопрос с арендой, избежать конфликта или сдать помещение. Результат: Гараж пуст/готов к сдаче, договоренность с хозяином достигнута.',
      priority: 'Высокий',
      tag: 'хозяйство',
      deadline: '2026-01-22'
    },
    {
      title: 'Сертификат CT KZ (координация)',
      description: 'Координировать процесс совместно с Диасом, общаться с экспертами, готовить образцы продукции. Цель: Ускорить получение сертификата через менеджмент процесса. Результат: Сертификат получен.',
      priority: 'Высокий',
      tag: 'сертификация'
    },
    {
      title: 'Упаковка набора Phobo',
      description: 'Разработать "дефолтный" дизайн коробки и комплектацию набора. Цель: Привести продукт в товарный вид для продажи. Результат: Готовый макет упаковки или собранный физический образец набора.',
      priority: 'Высокий',
      tag: 'продукт'
    },
    {
      title: 'Omarket и НКТ',
      description: 'После ревизии товара выяснить требования площадок и зарегистрироваться. Цель: Расширить каналы сбыта на государственные учреждения. Результат: Аккаунты зарегистрированы, товары выставлены.',
      priority: 'Средний',
      tag: 'партнерство'
    },
    {
      title: 'Видео Unitree',
      description: 'Отобрать и отправить/опубликовать видеоматериалы с роботами. Цель: Маркетинговая активность, демонстрация товара. Результат: Видео отправлены клиентам или опубликованы.',
      priority: 'Средний',
      tag: 'маркетинг'
    },
    {
      title: 'Заказать книжку',
      description: 'Найти типографию, напечатать тираж методичек/учебников. Цель: Укомплектовать образовательные наборы. Результат: Тираж книг получен на склад.',
      priority: 'Низкий',
      tag: 'закупки'
    }
  ]
};

async function main() {
  try {
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Logged in successfully\n');

    console.log('👥 Getting employees...');
    const employees = await getEmployees(token);
    console.log('✅ Found employees:', employees.length, '\n');

    // Создаем map имя -> ID
    const employeeMap: Record<string, number> = {};
    for (const emp of employees) {
      employeeMap[emp.name] = emp.id;
      console.log(`  - ${emp.name} (ID: ${emp.id})`);
    }
    console.log('');

    // Создаем задачи для каждого сотрудника
    let totalCreated = 0;

    for (const [employeeName, tasks] of Object.entries(tasksByEmployee)) {
      const employeeId = employeeMap[employeeName];

      if (!employeeId) {
        console.log(`⚠️  Employee "${employeeName}" not found, skipping tasks...`);
        continue;
      }

      console.log(`\n📋 Creating tasks for ${employeeName}...`);

      for (const task of tasks) {
        try {
          const taskData = {
            title: task.title,
            description: task.description,
            priority: task.priority as 'Высокий' | 'Средний' | 'Низкий',
            assigneeId: employeeId,
            tag: task.tag,
            deadline: task.deadline || undefined,
            checklist: []
          };

          await createTask(token, taskData);
          console.log(`  ✅ ${task.title}`);
          totalCreated++;
        } catch (error) {
          console.error(`  ❌ Failed to create task "${task.title}":`, error);
        }
      }
    }

    console.log(`\n\n🎉 Done! Created ${totalCreated} tasks total.`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
