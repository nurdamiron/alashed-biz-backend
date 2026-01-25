/**
 * SMS Provider Interface
 * Supports multiple SMS providers for Kazakhstan
 */

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(phone: string, message: string): Promise<SmsSendResult>;
  getBalance(): Promise<number | null>;
}

/**
 * Mobizon SMS Provider (popular in Kazakhstan)
 * https://mobizon.kz
 */
export class MobizonProvider implements SmsProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.mobizon.kz/service';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(phone: string, message: string): Promise<SmsSendResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/message/sendSmsMessage?apiKey=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            recipient: this.formatPhone(phone),
            text: message,
          }),
        }
      );

      const data = await response.json();

      if (data.code === 0) {
        return {
          success: true,
          messageId: data.data?.messageId,
        };
      }

      return {
        success: false,
        error: data.message || 'Unknown error',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getBalance(): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user/getOwnBalance?apiKey=${this.apiKey}`
      );
      const data = await response.json();
      return data.code === 0 ? parseFloat(data.data?.balance) : null;
    } catch {
      return null;
    }
  }

  private formatPhone(phone: string): string {
    // Remove all non-digits and ensure +7 prefix for Kazakhstan
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7')) {
      digits = '7' + digits;
    }
    return digits;
  }
}

/**
 * SMS.kz Provider
 * https://sms.kz
 */
export class SmsKzProvider implements SmsProvider {
  private readonly login: string;
  private readonly password: string;
  private readonly sender: string;
  private readonly baseUrl = 'https://smsc.kz/sys/send.php';

  constructor(login: string, password: string, sender: string = 'ALASHED') {
    this.login = login;
    this.password = password;
    this.sender = sender;
  }

  async send(phone: string, message: string): Promise<SmsSendResult> {
    try {
      const params = new URLSearchParams({
        login: this.login,
        psw: this.password,
        phones: this.formatPhone(phone),
        mes: message,
        sender: this.sender,
        fmt: '3', // JSON response
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.id) {
        return {
          success: true,
          messageId: data.id.toString(),
        };
      }

      return {
        success: false,
        error: data.error || 'Unknown error',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getBalance(): Promise<number | null> {
    try {
      const params = new URLSearchParams({
        login: this.login,
        psw: this.password,
        fmt: '3',
        bal: '1',
      });

      const response = await fetch(`https://smsc.kz/sys/balance.php?${params}`);
      const data = await response.json();
      return data.balance ? parseFloat(data.balance) : null;
    } catch {
      return null;
    }
  }

  private formatPhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7')) {
      digits = '7' + digits;
    }
    return '+' + digits;
  }
}

/**
 * Mock SMS Provider for development/testing
 */
export class MockSmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<SmsSendResult> {
    console.log(`[MOCK SMS] To: ${phone}`);
    console.log(`[MOCK SMS] Message: ${message}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  async getBalance(): Promise<number | null> {
    return 1000; // Mock balance
  }
}
