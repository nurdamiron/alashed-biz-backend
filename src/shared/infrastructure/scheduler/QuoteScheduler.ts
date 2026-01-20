import cron from 'node-cron';
import { GeminiProvider } from '../../../domains/ai/infrastructure/providers/GeminiProvider.js';
import { PushService } from '../../../domains/notifications/infrastructure/services/PushService.js';
import { query } from '../database/PostgresConnection.js';

const BASE_PROMPT = `Напиши одну короткую цитату известного бизнесмена или предпринимателя на русском языке.

Требования:
- Цитата должна быть от реального известного бизнесмена (Илон Маск, Стив Джобс, Джефф Безос, Уоррен Баффет, Билл Гейтс, Марк Цукерберг, Джек Ма, Ричард Брэнсон, Сэм Альтман и др.)
- Максимум 1-2 предложения
- О работе, успехе, мотивации или бизнесе
- Формат: "Цитата" — Имя Автора

Ответь только цитатой в указанном формате, без лишнего текста.`;

/**
 * Scheduler for sending daily motivational quotes via push notifications
 */
export class QuoteScheduler {
  private geminiProvider: GeminiProvider;
  private pushService: PushService;
  private isRunning = false;
  private maxHistory = 30; // Хранить последние 30 цитат

  constructor(geminiProvider: GeminiProvider, pushService: PushService) {
    this.geminiProvider = geminiProvider;
    this.pushService = pushService;
  }

  /**
   * Load recent quotes from database
   */
  private async loadRecentQuotes(): Promise<string[]> {
    try {
      const result = await query(
        'SELECT quote FROM quote_history ORDER BY sent_at DESC LIMIT $1',
        [this.maxHistory]
      );
      return result.rows.map(row => row.quote);
    } catch (error) {
      console.error('[QuoteScheduler] Failed to load quote history:', error);
      return [];
    }
  }

  /**
   * Save quote to database
   */
  private async saveQuote(quote: string): Promise<void> {
    try {
      await query(
        'INSERT INTO quote_history (quote) VALUES ($1)',
        [quote]
      );
    } catch (error) {
      console.error('[QuoteScheduler] Failed to save quote:', error);
    }
  }

  /**
   * Generate a motivational quote using AI (no repetitions)
   */
  private async generateQuote(): Promise<string> {
    let prompt = BASE_PROMPT;

    // Загружаем историю из БД
    const recentQuotes = await this.loadRecentQuotes();

    // Добавляем историю чтобы не повторяться
    if (recentQuotes.length > 0) {
      prompt += `\n\nНЕ ПОВТОРЯЙ эти цитаты которые уже были:\n${recentQuotes.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }

    const quote = await this.geminiProvider.chat(prompt);
    const trimmedQuote = quote.trim();

    // Сохраняем в БД
    await this.saveQuote(trimmedQuote);

    return trimmedQuote;
  }

  /**
   * Send quote to all users
   */
  private async sendQuoteToAll(isMorning: boolean): Promise<void> {
    const timeOfDay = isMorning ? 'утро' : 'вечер';
    console.log(`[QuoteScheduler] Sending ${timeOfDay} quote...`);

    try {
      const quote = await this.generateQuote();
      const title = isMorning ? '🌅 Доброе утро!' : '🌙 Добрый вечер!';

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
  async sendTestQuote(): Promise<string> {
    const quote = await this.generateQuote();

    const count = await this.pushService.broadcast({
      title: '💡',
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

  /**
   * Get quote without sending (for testing)
   */
  async getQuote(): Promise<string> {
    return this.generateQuote();
  }
}
