import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { OrderStatus } from '../../domain/value-objects/OrderStatus.js';
import { GetOrdersQueryDto, OrdersListDto } from '../dto/OrderDto.js';
import { OrderMapper } from '../mappers/OrderMapper.js';

export class GetOrdersHandler implements UseCase<GetOrdersQueryDto, OrdersListDto> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(request: GetOrdersQueryDto): Promise<Result<OrdersListDto>> {
    try {
      const filters = request.status
        ? { status: OrderStatus.create(request.status) }
        : undefined;

      const pagination = {
        limit: request.limit ?? 50,
        offset: request.offset ?? 0,
      };

      const [orders, total] = await Promise.all([
        this.orderRepository.findAll(filters, pagination),
        this.orderRepository.count(filters),
      ]);

      return Result.ok({
        orders: OrderMapper.toDtoList(orders),
        total,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get orders');
    }
  }
}
