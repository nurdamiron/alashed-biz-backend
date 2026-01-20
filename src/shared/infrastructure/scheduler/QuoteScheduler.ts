import cron from 'node-cron';
import { GeminiProvider } from '../../../domains/ai/infrastructure/providers/GeminiProvider.js';
import { PushService } from '../../../domains/notifications/infrastructure/services/PushService.js';

const MORNING_PROMPT = `Сгенерируй короткую мотивационную цитату на русском языке для начала рабочего дня.
Цитата должна быть:
- Короткой (максимум 2 предложения)
- Реалистичной и практичной (не слишком пафосной)
- Мотивирующей к продуктивной работе
- Без указания автора

Примеры стиля:
- "Каждый день - это новая возможность стать лучше. Начни с малого."
- "Успех складывается из маленьких ежедневных усилий."

Ответь только цитатой, без лишнего текста.`;

const EVENING_PROMPT = `Сгенерируй короткую мотивационную цитату на русском языке для завершения рабочего дня.
Цитата должна быть:
- Короткой (максимум 2 предложения)
- Реалистичной (признание усталости, но с позитивом)
- Помогающей отпустить рабочие заботы
- Без указания автора

Примеры стиля:
- "Хороший отдых сегодня - это энергия на завтра. Ты заслужил перерыв."
- "День закончен. Отпусти то, что не успел - завтра новые возможности."

Ответь только цитатой, без лишнего текста.`;

/**
 * Scheduler for sending daily motivational quotes via push notifications
 */
export class QuoteScheduler {
  private geminiProvider: GeminiProvider;
  private pushService: PushService;
  private isRunning = false;

  constructor(geminiProvider: GeminiProvider, pushService: PushService) {
    this.geminiProvider = geminiProvider;
    this.pushService = pushService;
  }

  /**
   * Generate a motivational quote using AI
   */
  private async generateQuote(isMorning: boolean): Promise<string> {
    try {
      const prompt = isMorning ? MORNING_PROMPT : EVENING_PROMPT;
      const quote = await this.geminiProvider.chat(prompt);
      return quote.trim();
    } catch (error) {
      console.error('[QuoteScheduler] Failed to generate quote:', error);
      // Fallback quotes
      const fallbacks = isMorning
        ? [
            'Новый день - новые возможности. Действуй!',
            'Каждое утро - это шанс начать заново.',
            'Маленькие шаги каждый день ведут к большим результатам.',
          ]
        : [
            'День завершен. Отдохни и набирайся сил.',
            'Ты сделал все что мог сегодня. Завтра будет новый день.',
            'Хороший отдых - залог продуктивного завтра.',
          ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  /**
   * Send quote to all users
   */
  private async sendQuoteToAll(isMorning: boolean): Promise<void> {
    const timeOfDay = isMorning ? 'утро' : 'вечер';
    console.log(`[QuoteScheduler] Sending ${timeOfDay} quote...`);

    try {
      const quote = await this.generateQuote(isMorning);
      const title = isMorning ? 'Доброе утро!' : 'Добрый вечер!';

      const count = await this.pushService.broadcast({
        title,
        body: quote,
        tag: `daily-quote-${isMorning ? 'morning' : 'evening'}`,
        data: {
          type: 'daily-quote',
          url: '/',
        },
      });

      console.log(`[QuoteScheduler] Quote sent to ${count} device(s): "${quote}"`);
    } catch (error) {
      console.error('[QuoteScheduler] Failed to send quote:', error);
    }
  }

  /**
   * Start the scheduler
   * Morning: 9:00 AM (Almaty time, UTC+5)
   * Evening: 9:00 PM (Almaty time, UTC+5)
   */
  start(): void {
    if (this.isRunning) {
      console.log('[QuoteScheduler] Already running');
      return;
    }

    // Morning quote at 9:00 AM Almaty (04:00 UTC)
    cron.schedule('0 4 * * *', () => {
      this.sendQuoteToAll(true);
    }, {
      timezone: 'UTC',
    });

    // Evening quote at 9:00 PM Almaty (16:00 UTC)
    cron.schedule('0 16 * * *', () => {
      this.sendQuoteToAll(false);
    }, {
      timezone: 'UTC',
    });

    this.isRunning = true;
    console.log('[QuoteScheduler] Started - Morning: 9:00 AM, Evening: 9:00 PM (Almaty time)');
  }

  /**
   * Send a test quote immediately
   */
  async sendTestQuote(isMorning: boolean = true): Promise<string> {
    const quote = await this.generateQuote(isMorning);
    const title = isMorning ? 'Доброе утро!' : 'Добрый вечер!';

    const count = await this.pushService.broadcast({
      title,
      body: quote,
      tag: 'test-quote',
      data: {
        type: 'daily-quote',
        url: '/',
      },
    });

    console.log(`[QuoteScheduler] Test quote sent to ${count} device(s)`);
    return quote;
  }
}
