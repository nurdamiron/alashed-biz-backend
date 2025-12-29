import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { ProductId } from '../../domain/value-objects/ProductId.js';

export interface DeleteProductDto {
  productId: number;
}

export class DeleteProductHandler implements UseCase<DeleteProductDto, void> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: DeleteProductDto): Promise<Result<void>> {
    try {
      const productId = ProductId.create(request.productId);
      const product = await this.productRepository.findById(productId);

      if (!product) {
        return Result.fail(`Product ${request.productId} not found`);
      }

      // Soft delete - deactivate the product
      product.deactivate();
      await this.productRepository.update(product);

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to delete product');
    }
  }
}
