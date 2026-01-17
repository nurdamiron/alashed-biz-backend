import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Маппинг сотрудников
const EMPLOYEES = {
  NURDA: 4,
  KAZBEK: 3,
  DIAS: 1,
  BEKS: 2
};

const tasks = [
  // Нурдаулет - 5 задач
  {
    title: 'Архитектура Studio Alashed',
    description: 'Разработать схему взаимодействия модулей (AI, Block coding, Python/JS) для учителей и учеников. Цель: Создать масштабируемую базу для платформы. Результат: Утвержденная техническая документация и схема архитектуры.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.NURDA,
    tag: 'разработка'
  },
  {
    title: 'Поднять Blocks и Studio Alashed',
    description: 'Написать код, настроить сервера, запустить рабочие версии инструментов. Цель: Обеспечить работоспособность продукта для пользователей. Результат: Рабочие ссылки, где можно писать код и использовать блоки.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.NURDA,
    tag: 'разработка'
  },
  {
    title: 'Исправить Лендинг',
    description: 'Провести аудит текущего сайта, исправить баги верстки, обновить контент. Цель: Повысить доверие клиентов и конверсию в заявку. Результат: Сайт без ошибок, с актуальной информацией и работающими формами.',
    priority: 'Средний',
    assignee_id: EMPLOYEES.NURDA,
    tag: 'веб'
  },
  {
    title: 'Упаковать проектное бюро',
    description: 'Создать страницу или презентацию услуги по аналогии с osn.kz. Цель: Запустить новое направление продаж (услуги, а не только товары). Результат: Опубликованная страница или готовая презентация для отправки клиенту.',
    priority: 'Средний',
    assignee_id: EMPLOYEES.NURDA,
    tag: 'бизнес'
  },
  {
    title: 'Astana Hub льготные программы',
    description: 'Изучить условия, собрать документы и подать заявку на участие. Цель: Получить налоговые льготы и статус IT-стартапа. Результат: Поданная заявка или полученный статус участника.',
    priority: 'Средний',
    assignee_id: EMPLOYEES.NURDA,
    tag: 'бизнес'
  },

  // Казбек - 3 задачи
  {
    title: 'Ревизия товаров',
    description: 'Пересчитать весь физический склад, сверить с базой Satu.kz, удалить несуществующие позиции. Цель: Понимать реальные остатки, чтобы не продавать воздух. Результат: Актуальная Excel-таблица или CRM с точными остатками.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.KAZBEK,
    tag: 'склад'
  },
  {
    title: 'Магазин на Kaspi',
    description: 'Загрузить товары на маркетплейс, выставить актуальные цены и остатки после ревизии. Цель: Увеличить продажи через самый популярный канал. Результат: Активный магазин на Kaspi с доступными к покупке товарами.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.KAZBEK,
    tag: 'продажи'
  },
  {
    title: 'Закуп Arduino Uno',
    description: 'Найти поставщика, оплатить и привезти партию базовых плат. Цель: Обеспечить склад самым ходовым компонентом для наборов. Результат: Товар лежит на складе и готов к сборке.',
    priority: 'Средний',
    assignee_id: EMPLOYEES.KAZBEK,
    tag: 'закупки'
  },

  // Диас - 3 задачи
  {
    title: 'Авторские права на учебные материалы',
    description: 'Подготовить документы и зарегистрировать права на учебные материалы. Цель: Защитить интеллектуальную собственность от копирования конкурентами. Результат: Полученное свидетельство о регистрации прав.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.DIAS,
    tag: 'юридическое'
  },
  {
    title: 'Сертификат CT KZ (юр. часть)',
    description: 'Собрать юридическую часть документов совместно с Бексом. Цель: Получить доступ к государственным тендерам и закупкам. Результат: Пакет документов готов к подаче.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.DIAS,
    tag: 'сертификация'
  },
  {
    title: 'SEO / Гео-оптимизация',
    description: 'Настроить карточки в 2ГИС, Google Maps, Яндекс, прописать ключевые слова на сайте. Цель: Получать бесплатных клиентов из поиска. Результат: Сайт и компания выходят на первой странице поиска по ключевым запросам.',
    priority: 'Средний',
    assignee_id: EMPLOYEES.DIAS,
    tag: 'маркетинг'
  },

  // Бекс - 6 задач
  {
    title: 'Гараж - навести порядок (СРОЧНО)',
    description: 'Вывезти лишние вещи, навести порядок, позвонить хозяину (срок: пара дней). Цель: Решить вопрос с арендой, избежать конфликта или сдать помещение. Результат: Гараж пуст/готов к сдаче, договоренность с хозяином достигнута.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.BEKS,
    tag: 'хозяйство',
    deadline: '2026-01-22'
  },
  {
    title: 'Сертификат CT KZ (координация)',
    description: 'Координировать процесс совместно с Диасом, общаться с экспертами, готовить образцы продукции. Цель: Ускорить получение сертификата через менеджмент процесса. Результат: Сертификат получен.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.BEKS,
    tag: 'сертификация'
  },
  {
    title: 'Упаковка набора Phobo',
    description: 'Разработать "дефолтный" дизайн коробки и комплектацию набора. Цель: Привести продукт в товарный вид для продажи. Результат: Готовый макет упаковки или собранный физический образец набора.',
    priority: 'Высокий',
    assignee_id: EMPLOYEES.BEKS,
    tag: 'продукт'
  },
  {
    title: 'Omarket и НКТ',
    description: 'После ревизии товара выяснить требования площадок и зарегистрироваться. Цель: Расширить каналы сбыта на государственные учреждения. Результат: Аккаунты зарегистрированы, товары выставлены.',
    priority: 'Средний',
    assignee_id: EMPLOYEES.BEKS,
    tag: 'партнерство'
  },
  {
    title: 'Видео Unitree',
    description: 'Отобрать и отправить/опубликовать видеоматериалы с роботами. Цель: Маркетинговая активность, демонстрация товара. Результат: Видео отправлены клиентам или опубликованы.',
    priority: 'Средний',
    assignee_id: EMPLOYEES.BEKS,
    tag: 'маркетинг'
  },
  {
    title: 'Заказать книжку',
    description: 'Найти типографию, напечатать тираж методичек/учебников. Цель: Укомплектовать образовательные наборы. Результат: Тираж книг получен на склад.',
    priority: 'Низкий',
    assignee_id: EMPLOYEES.BEKS,
    tag: 'закупки'
  }
];

async function insertTasks() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🗄️  Connected to database\n');

    let inserted = 0;

    for (const task of tasks) {
      const query = `
        INSERT INTO tasks (
          title,
          description,
          priority,
          status,
          assignee_id,
          deadline,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, title, assignee_id
      `;

      const values = [
        task.title,
        task.description,
        task.priority,
        'К выполнению',
        task.assignee_id,
        task.deadline || null
      ];

      const result = await client.query(query, values);
      console.log(`✅ Created: ${result.rows[0].title} (ID: ${result.rows[0].id}, Assignee: ${result.rows[0].assignee_id})`);
      inserted++;
    }

    console.log(`\n🎉 Successfully inserted ${inserted} tasks!`);

    // Показать статистику
    console.log('\n📊 Tasks by employee:');
    const stats = await client.query(`
      SELECT
        e.name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.priority = 'Высокий' THEN 1 ELSE 0 END) as high_priority,
        SUM(CASE WHEN t.priority = 'Средний' THEN 1 ELSE 0 END) as medium_priority,
        SUM(CASE WHEN t.priority = 'Низкий' THEN 1 ELSE 0 END) as low_priority
      FROM employees e
      LEFT JOIN tasks t ON e.id = t.assignee_id
      GROUP BY e.id, e.name
      ORDER BY task_count DESC
    `);

    stats.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.task_count} задач (🔴 ${row.high_priority} | 🟡 ${row.medium_priority} | 🟢 ${row.low_priority})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

insertTasks();
