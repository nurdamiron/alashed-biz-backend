import {
  SmsProvider,
  SmsSendResult,
  MobizonProvider,
  SmsKzProvider,
  MockSmsProvider,
} from '../providers/SmsProvider.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export interface SmsTemplate {
  orderCreated: (orderId: number, total: number) => string;
  orderProcessing: (orderId: number) => string;
  orderShipped: (orderId: number) => string;
  orderDelivered: (orderId: number) => string;
  orderCancelled: (orderId: number, reason?: string) => string;
}

/**
 * SMS Service for sending notifications to customers
 */
export class SmsService {
  private provider: SmsProvider;
  private isEnabled: boolean;
  private companyName: string;

  // SMS Templates in Russian
  private templates: SmsTemplate = {
    orderCreated: (orderId: number, total: number) =>
      `${this.companyName}: Ваш заказ #${orderId} на сумму ${total.toLocaleString()}тг принят. Ожидайте подтверждения.`,

    orderProcessing: (orderId: number) =>
      `${this.companyName}: Заказ #${orderId} обрабатывается. Скоро будет готов к отправке.`,

    orderShipped: (orderId: number) =>
      `${this.companyName}: Заказ #${orderId} отправлен. Ожидайте доставку.`,

    orderDelivered: (orderId: number) =>
      `${this.companyName}: Заказ #${orderId} доставлен. Спасибо за покупку!`,

    orderCancelled: (orderId: number, reason?: string) =>
      `${this.companyName}: Заказ #${orderId} отменён.${reason ? ` Причина: ${reason}` : ''} Свяжитесь с нами для деталей.`,
  };

  constructor() {
    this.companyName = process.env.COMPANY_NAME || 'ALASHED';
    this.isEnabled = process.env.SMS_ENABLED === 'true';

    // Initialize provider based on configuration
    const providerType = process.env.SMS_PROVIDER || 'mock';

    switch (providerType.toLowerCase()) {
      case 'mobizon':
        const mobizonKey = process.env.MOBIZON_API_KEY;
        if (mobizonKey) {
          this.provider = new MobizonProvider(mobizonKey);
        } else {
          console.warn('MOBIZON_API_KEY not set, using mock provider');
          this.provider = new MockSmsProvider();
        }
        break;

      case 'smskz':
        const smsKzLogin = process.env.SMSKZ_LOGIN;
        const smsKzPassword = process.env.SMSKZ_PASSWORD;
        const smsKzSender = process.env.SMSKZ_SENDER;
        if (smsKzLogin && smsKzPassword) {
          this.provider = new SmsKzProvider(smsKzLogin, smsKzPassword, smsKzSender);
        } else {
          console.warn('SMSKZ credentials not set, using mock provider');
          this.provider = new MockSmsProvider();
        }
        break;

      default:
        this.provider = new MockSmsProvider();
    }

    console.log(`SMS Service initialized: provider=${providerType}, enabled=${this.isEnabled}`);
  }

  /**
   * Send SMS to a phone number
   */
  async send(phone: string, message: string): Promise<SmsSendResult> {
    if (!this.isEnabled) {
      console.log(`[SMS DISABLED] Would send to ${phone}: ${message}`);
      return { success: true, messageId: 'disabled' };
    }

    // Validate phone number (Kazakhstan format)
    if (!this.isValidKzPhone(phone)) {
      return { success: false, error: 'Invalid phone number' };
    }

    // Log SMS attempt
    await this.logSms(phone, message, 'pending');

    const result = await this.provider.send(phone, message);

    // Update log with result
    await this.updateSmsLog(phone, result);

    return result;
  }

  /**
   * Notify customer about order creation
   */
  async notifyOrderCreated(orderId: number): Promise<SmsSendResult | null> {
    const customer = await this.getOrderCustomer(orderId);
    if (!customer?.phone) return null;

    const order = await this.getOrderTotal(orderId);
    if (!order) return null;

    const message = this.templates.orderCreated(orderId, order.total);
    return this.send(customer.phone, message);
  }

  /**
   * Notify customer about order status change
   */
  async notifyOrderStatusChanged(orderId: number, status: string, reason?: string): Promise<SmsSendResult | null> {
    const customer = await this.getOrderCustomer(orderId);
    if (!customer?.phone) return null;

    let message: string;

    switch (status) {
      case 'processing':
        message = this.templates.orderProcessing(orderId);
        break;
      case 'shipped':
        message = this.templates.orderShipped(orderId);
        break;
      case 'delivered':
        message = this.templates.orderDelivered(orderId);
        break;
      case 'cancelled':
        message = this.templates.orderCancelled(orderId, reason);
        break;
      default:
        return null;
    }

    return this.send(customer.phone, message);
  }

  /**
   * Send custom SMS to customer
   */
  async sendCustomMessage(phone: string, message: string): Promise<SmsSendResult> {
    // Add company name prefix if not present
    if (!message.startsWith(this.companyName)) {
      message = `${this.companyName}: ${message}`;
    }
    return this.send(phone, message);
  }

  /**
   * Get SMS balance
   */
  async getBalance(): Promise<number | null> {
    return this.provider.getBalance();
  }

  /**
   * Check if SMS is enabled
   */
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // Private helper methods

  private isValidKzPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    // Kazakhstan phone: 7XXXXXXXXXX (11 digits) or 8XXXXXXXXXX
    return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
  }

  private async getOrderCustomer(orderId: number): Promise<{ phone: string; name: string } | null> {
    try {
      const result = await query(
        `SELECT c.phone, c.name
         FROM orders o
         JOIN customers c ON o.customer_id = c.id
         WHERE o.id = $1`,
        [orderId]
      );
      return result.rows[0] || null;
    } catch {
      return null;
    }
  }

  private async getOrderTotal(orderId: number): Promise<{ total: number } | null> {
    try {
      const result = await query(
        'SELECT total FROM orders WHERE id = $1',
        [orderId]
      );
      return result.rows[0] ? { total: parseFloat(result.rows[0].total) } : null;
    } catch {
      return null;
    }
  }

  private async logSms(phone: string, message: string, status: string): Promise<void> {
    try {
      await query(
        `INSERT INTO sms_logs (phone, message, status, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [phone, message.substring(0, 500), status]
      );
    } catch (error) {
      // Table might not exist yet, ignore
      console.error('Failed to log SMS:', error);
    }
  }

  private async updateSmsLog(phone: string, result: SmsSendResult): Promise<void> {
    try {
      await query(
        `UPDATE sms_logs
         SET status = $1, message_id = $2, error = $3, sent_at = NOW()
         WHERE phone = $4 AND sent_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [result.success ? 'sent' : 'failed', result.messageId, result.error, phone]
      );
    } catch {
      // Ignore errors
    }
  }
}
