import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { ProductId } from '../../domain/value-objects/ProductId.js';

interface ReceiveGoodsRequest {
  productId: number;
  quantity: number;
  supplierId?: number;
  documentNumber?: string;
  notes?: string;
  userId?: number;
}

export class ReceiveGoodsHandler implements UseCase<ReceiveGoodsRequest, void> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: ReceiveGoodsRequest): Promise<Result<void>> {
    try {
      // Получить товар
      const product = await this.productRepository.findById(ProductId.create(request.productId));

      if (!product) {
        return Result.fail('Product not found');
      }

      // Увеличить остаток
      const log = product.adjustStock(
        request.quantity,
        request.notes || `Приемка товара${request.documentNumber ? ` по док. ${request.documentNumber}` : ''}`,
        request.userId
      );

      // Обновить товар
      await this.productRepository.update(product);

      // Сохранить лог с информацией о поставщике
      await this.productRepository.adjustStock(ProductId.create(request.productId), log);

      // Опционально: обновить supplier_id товара, если указан
      if (request.supplierId && !product.supplierId) {
        product.update({ supplierId: request.supplierId });
        await this.productRepository.update(product);
      }

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to receive goods');
    }
  }
}
