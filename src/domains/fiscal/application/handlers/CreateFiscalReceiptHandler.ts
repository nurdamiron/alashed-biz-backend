import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { WebkassaProvider } from '../../infrastructure/providers/WebkassaProvider.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

interface CreateFiscalReceiptRequest {
  orderId: number;
  cashierId?: number;
}

interface FiscalReceiptDto {
  id: number;
  orderId: number;
  receiptNumber: string;
  fiscalSign: string;
  qrCodeUrl: string;
  amount: number;
  status: string;
  createdAt: string;
}

export class CreateFiscalReceiptHandler implements UseCase<CreateFiscalReceiptRequest, FiscalReceiptDto> {
  constructor(private readonly webkassaProvider: WebkassaProvider) {}

  async execute(request: CreateFiscalReceiptRequest): Promise<Result<FiscalReceiptDto>> {
    try {
      // 1. Получить заказ с позициями
      const orderResult = await query(
        `SELECT o.*, oi.product_name, oi.quantity, oi.unit_price
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.id = $1`,
        [request.orderId]
      );

      if (orderResult.rows.length === 0) {
        return Result.fail('Order not found');
      }

      const order = orderResult.rows[0];
      const items = orderResult.rows;

      // Проверить, не фискализован ли уже
      const existing = await query(
        'SELECT id FROM fiscal_receipts WHERE order_id = $1 AND status = $2',
        [request.orderId, 'success']
      );

      if (existing.rows.length > 0) {
        return Result.fail('Order already fiscalized');
      }

      // 2. Подготовить позиции для Webkassa
      const positions = items.map((item) => ({
        Name: item.product_name,
        Price: parseFloat(item.unit_price),
        Quantity: item.quantity,
        Tax: 2, // НДС 12% (код 2 в Webkassa РК)
        TaxPercent: 12,
      }));

      // 3. Отправить в Webkassa
      const webkassaResponse = await this.webkassaProvider.createReceipt({
        positions,
        total: parseFloat(order.total_amount),
      });

      if (!webkassaResponse.success) {
        // Сохранить ошибку
        await query(
          `INSERT INTO fiscal_receipts (order_id, cashier_id, amount, status, error_message, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [request.orderId, request.cashierId, order.total_amount, 'error', webkassaResponse.errorMessage]
        );

        return Result.fail(webkassaResponse.errorMessage || 'Failed to create fiscal receipt');
      }

      // 4. Сохранить успешный чек в БД
      const taxAmount = parseFloat(order.total_amount) * 0.12; // НДС 12%

      const result = await query(
        `INSERT INTO fiscal_receipts (order_id, receipt_number, fiscal_sign, qr_code_url, amount, tax_amount, cashier_id, fiscal_date, response_json, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, NOW()) RETURNING id, created_at`,
        [
          request.orderId,
          webkassaResponse.receiptNumber,
          webkassaResponse.fiscalSign,
          webkassaResponse.qrUrl,
          order.total_amount,
          taxAmount,
          request.cashierId,
          JSON.stringify(webkassaResponse.rawResponse),
          'success',
        ]
      );

      // 5. Обновить заказ
      await query(
        'UPDATE orders SET receipt_url = $1, fiscal_number = $2, is_fiscalized = true WHERE id = $3',
        [webkassaResponse.qrUrl, webkassaResponse.receiptNumber, request.orderId]
      );

      const savedReceipt = result.rows[0];

      return Result.ok({
        id: savedReceipt.id,
        orderId: request.orderId,
        receiptNumber: webkassaResponse.receiptNumber!,
        fiscalSign: webkassaResponse.fiscalSign!,
        qrCodeUrl: webkassaResponse.qrUrl!,
        amount: parseFloat(order.total_amount),
        status: 'success',
        createdAt: new Date(savedReceipt.created_at).toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create fiscal receipt');
    }
  }
}
