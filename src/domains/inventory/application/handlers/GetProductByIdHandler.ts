import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { ProductId } from '../../domain/value-objects/ProductId.js';
import { ProductDto } from '../dto/ProductDto.js';
import { ProductMapper } from '../mappers/ProductMapper.js';

export class GetProductByIdHandler implements UseCase<{ productId: number }, ProductDto> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: { productId: number }): Promise<Result<ProductDto>> {
    try {
      const product = await this.productRepository.findById(ProductId.create(request.productId));
      if (!product) return Result.fail(`Product ${request.productId} not found`);
      return Result.ok(ProductMapper.toDto(product));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to get product');
    }
  }
}
