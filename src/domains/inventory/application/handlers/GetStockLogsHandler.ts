import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { ProductId } from '../../domain/value-objects/ProductId.js';
import { StockLogDto } from '../dto/ProductDto.js';
import { ProductMapper } from '../mappers/ProductMapper.js';

export class GetStockLogsHandler implements UseCase<{ productId: number; limit?: number }, StockLogDto[]> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: { productId: number; limit?: number }): Promise<Result<StockLogDto[]>> {
    try {
      const logs = await this.productRepository.getStockLogs(ProductId.create(request.productId), request.limit ?? 50);
      return Result.ok(logs.map(log => ProductMapper.logToDto(log)));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to get stock logs');
    }
  }
}
