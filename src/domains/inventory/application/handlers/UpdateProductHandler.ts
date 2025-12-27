import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { ProductId } from '../../domain/value-objects/ProductId.js';
import { Money } from '../../../orders/domain/value-objects/Money.js';
import { UpdateProductDto, ProductDto } from '../dto/ProductDto.js';
import { ProductMapper } from '../mappers/ProductMapper.js';

export class UpdateProductHandler implements UseCase<UpdateProductDto, ProductDto> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: UpdateProductDto): Promise<Result<ProductDto>> {
    try {
      const product = await this.productRepository.findById(ProductId.create(request.productId));
      if (!product) return Result.fail(`Product ${request.productId} not found`);

      product.update({
        name: request.name, description: request.description,
        price: request.price !== undefined ? Money.create(request.price) : undefined,
        costPrice: request.costPrice !== undefined ? Money.create(request.costPrice) : undefined,
        minStockLevel: request.minStockLevel, barcode: request.barcode,
        categoryId: request.categoryId, brandId: request.brandId,
      });

      await this.productRepository.update(product);
      return Result.ok(ProductMapper.toDto(product));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to update product');
    }
  }
}
