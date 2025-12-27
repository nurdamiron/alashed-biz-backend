import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { SearchProductsQueryDto, ProductDto } from '../dto/ProductDto.js';
import { ProductMapper } from '../mappers/ProductMapper.js';

export class SearchProductsHandler implements UseCase<SearchProductsQueryDto, ProductDto[]> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: SearchProductsQueryDto): Promise<Result<ProductDto[]>> {
    try {
      if (!request.query || request.query.trim().length < 2) return Result.ok([]);
      const products = await this.productRepository.search(request.query.trim());
      return Result.ok(ProductMapper.toDtoList(products));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to search products');
    }
  }
}
