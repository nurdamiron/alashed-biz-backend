import { config } from '../../../../config/index.js';

export interface WebkassaReceiptPosition {
  Name: string;
  Price: number;
  Quantity: number;
  Tax: number; // 2 = НДС 12% в РК
  TaxPercent: number;
}

export interface WebkassaReceiptRequest {
  positions: WebkassaReceiptPosition[];
  total: number;
  cashboxId?: string;
}

export interface WebkassaReceiptResponse {
  success: boolean;
  receiptNumber?: string;
  fiscalSign?: string;
  qrUrl?: string;
  errorMessage?: string;
  rawResponse?: any;
}

/**
 * Webkassa Provider для интеграции с фискальной системой РК
 * Документация: https://webkassa.kz/api
 */
export class WebkassaProvider {
  private apiUrl: string;
  private token: string;
  private cashboxId: string;
  private testMode: boolean;

  constructor() {
    this.apiUrl = config.webkassa?.apiUrl || 'https://devkkm.webkassa.kz/api';
    this.token = config.webkassa?.token || '';
    this.cashboxId = config.webkassa?.cashboxId || '';
    this.testMode = config.webkassa?.testMode !== false;
  }

  /**
   * Создать фискальный чек
   */
  async createReceipt(request: WebkassaReceiptRequest): Promise<WebkassaReceiptResponse> {
    try {
      if (!this.token || !this.cashboxId) {
        if (this.testMode) {
          // В тестовом режиме вернуть мокированный ответ
          return this.createMockReceipt(request);
        }
        throw new Error('Webkassa credentials not configured');
      }

      // Реальный запрос к Webkassa API
      const response = await fetch(`${this.apiUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          Command: 'RegisterCheck',
          CashboxUniqueNumber: request.cashboxId || this.cashboxId,
          Check: {
            CheckType: 0, // 0 = продажа, 1 = возврат
            Positions: request.positions,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Webkassa API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.Success) {
        return {
          success: false,
          errorMessage: data.Message || 'Webkassa returned error',
          rawResponse: data,
        };
      }

      return {
        success: true,
        receiptNumber: data.Data?.TicketNumber,
        fiscalSign: data.Data?.FiscalSign,
        qrUrl: data.Data?.CheckURL,
        rawResponse: data,
      };
    } catch (error) {
      console.error('Webkassa error:', error);

      // В случае ошибки в тестовом режиме вернуть мок
      if (this.testMode) {
        return this.createMockReceipt(request);
      }

      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Создать возвратный чек
   */
  async createRefund(originalReceipt: string, request: WebkassaReceiptRequest): Promise<WebkassaReceiptResponse> {
    try {
      if (!this.token || !this.cashboxId) {
        if (this.testMode) {
          return this.createMockReceipt(request);
        }
        throw new Error('Webkassa credentials not configured');
      }

      const response = await fetch(`${this.apiUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          Command: 'RegisterCheck',
          CashboxUniqueNumber: request.cashboxId || this.cashboxId,
          Check: {
            CheckType: 1, // 1 = возврат
            Positions: request.positions,
            OriginalTicketNumber: originalReceipt,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Webkassa API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: data.Success,
        receiptNumber: data.Data?.TicketNumber,
        fiscalSign: data.Data?.FiscalSign,
        qrUrl: data.Data?.CheckURL,
        errorMessage: !data.Success ? data.Message : undefined,
        rawResponse: data,
      };
    } catch (error) {
      if (this.testMode) {
        return this.createMockReceipt(request);
      }

      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Мокированный чек для тестирования
   */
  private createMockReceipt(request: WebkassaReceiptRequest): WebkassaReceiptResponse {
    const mockReceiptNumber = `TEST-${Date.now()}`;
    const mockFiscalSign = `FS${Math.random().toString(36).substring(7).toUpperCase()}`;

    return {
      success: true,
      receiptNumber: mockReceiptNumber,
      fiscalSign: mockFiscalSign,
      qrUrl: `https://dev.webkassa.kz/receipt/${mockReceiptNumber}`,
      rawResponse: {
        Success: true,
        Message: 'Test mode - mock receipt',
        Data: {
          TicketNumber: mockReceiptNumber,
          FiscalSign: mockFiscalSign,
          CheckURL: `https://dev.webkassa.kz/receipt/${mockReceiptNumber}`,
        },
      },
    };
  }

  /**
   * Проверить доступность Webkassa API
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (this.testMode) {
        return true; // В тестовом режиме всегда доступно
      }

      const response = await fetch(`${this.apiUrl}/status`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
