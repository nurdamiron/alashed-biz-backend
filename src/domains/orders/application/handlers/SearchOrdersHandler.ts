import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { SearchOrdersQueryDto, OrderDto } from '../dto/OrderDto.js';
import { OrderMapper } from '../mappers/OrderMapper.js';

export class SearchOrdersHandler implements UseCase<SearchOrdersQueryDto, OrderDto[]> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(request: SearchOrdersQueryDto): Promise<Result<OrderDto[]>> {
    try {
      if (!request.query || request.query.trim().length < 2) {
        return Result.ok([]);
      }

      const orders = await this.orderRepository.search(request.query.trim());

      return Result.ok(OrderMapper.toDtoList(orders));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to search orders');
    }
  }
}
