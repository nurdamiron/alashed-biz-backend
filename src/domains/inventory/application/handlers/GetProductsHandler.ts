import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { GetProductsQueryDto, ProductsListDto } from '../dto/ProductDto.js';
import { ProductMapper } from '../mappers/ProductMapper.js';

export class GetProductsHandler implements UseCase<GetProductsQueryDto, ProductsListDto> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: GetProductsQueryDto): Promise<Result<ProductsListDto>> {
    try {
      const filters: any = { isActive: true };
      if (request.categoryId) filters.categoryId = request.categoryId;
      if (request.brandId) filters.brandId = request.brandId;
      if (request.isLowStock) filters.isLowStock = true;
      if (request.isOutOfStock) filters.isOutOfStock = true;

      const pagination = request.limit ? { limit: request.limit, offset: request.offset ?? 0 } : undefined;
      const [products, total] = await Promise.all([
        this.productRepository.findAll(filters, pagination),
        this.productRepository.count(filters),
      ]);

      return Result.ok({ products: ProductMapper.toDtoList(products), total });
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to get products');
    }
  }
}
