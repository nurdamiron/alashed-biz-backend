import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export interface FiscalReceiptDto {
  id: number;
  orderId: number;
  receiptType: string;
  receiptNumber: string;
  fiscalSign: string;
  qrCodeUrl: string;
  amount: number;
  taxAmount: number;
  shiftId?: string;
  cashierId?: number;
  fiscalDate?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export class GetFiscalReceiptByOrderIdHandler implements UseCase<{ orderId: number }, FiscalReceiptDto> {
  async execute(request: { orderId: number }): Promise<Result<FiscalReceiptDto>> {
    try {
      const result = await query(
        `SELECT * FROM fiscal_receipts WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [request.orderId]
      );

      if (result.rows.length === 0) {
        return Result.fail(`No fiscal receipt found for order ${request.orderId}`);
      }

      const row = result.rows[0];

      const receipt: FiscalReceiptDto = {
        id: row.id,
        orderId: row.order_id,
        receiptType: row.receipt_type,
        receiptNumber: row.receipt_number,
        fiscalSign: row.fiscal_sign,
        qrCodeUrl: row.qr_code_url,
        amount: parseFloat(row.amount),
        taxAmount: row.tax_amount ? parseFloat(row.tax_amount) : 0,
        shiftId: row.shift_id,
        cashierId: row.cashier_id,
        fiscalDate: row.fiscal_date ? new Date(row.fiscal_date).toISOString() : undefined,
        status: row.status,
        errorMessage: row.error_message,
        createdAt: new Date(row.created_at).toISOString(),
      };

      return Result.ok(receipt);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get fiscal receipt');
    }
  }
}
