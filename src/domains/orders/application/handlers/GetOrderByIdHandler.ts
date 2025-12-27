import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { OrderId } from '../../domain/value-objects/OrderId.js';
import { OrderDto } from '../dto/OrderDto.js';
import { OrderMapper } from '../mappers/OrderMapper.js';

interface GetOrderByIdQuery {
  orderId: number;
}

export class GetOrderByIdHandler implements UseCase<GetOrderByIdQuery, OrderDto> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(request: GetOrderByIdQuery): Promise<Result<OrderDto>> {
    try {
      const orderId = OrderId.create(request.orderId);
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        return Result.fail(`Order ${request.orderId} not found`);
      }

      return Result.ok(OrderMapper.toDto(order));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get order');
    }
  }
}
