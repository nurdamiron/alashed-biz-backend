import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { ProductId } from '../../domain/value-objects/ProductId.js';
import { AdjustStockDto, ProductDto } from '../dto/ProductDto.js';
import { ProductMapper } from '../mappers/ProductMapper.js';

export class AdjustStockHandler implements UseCase<AdjustStockDto, ProductDto> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: AdjustStockDto): Promise<Result<ProductDto>> {
    try {
      const productId = ProductId.create(request.productId);
      const product = await this.productRepository.findById(productId);
      if (!product) return Result.fail(`Product ${request.productId} not found`);

      const log = product.adjustStock(request.delta, request.reason, request.userId);
      await this.productRepository.adjustStock(productId, log);

      const updated = await this.productRepository.findById(productId);
      return Result.ok(ProductMapper.toDto(updated!));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to adjust stock');
    }
  }
}
