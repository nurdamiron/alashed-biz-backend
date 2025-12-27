import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { OrderId } from '../../domain/value-objects/OrderId.js';
import { OrderStatus } from '../../domain/value-objects/OrderStatus.js';
import { UpdateOrderStatusDto, OrderDto } from '../dto/OrderDto.js';
import { OrderMapper } from '../mappers/OrderMapper.js';

export class UpdateOrderStatusHandler implements UseCase<UpdateOrderStatusDto, OrderDto> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(request: UpdateOrderStatusDto): Promise<Result<OrderDto>> {
    try {
      const orderId = OrderId.create(request.orderId);
      const newStatus = OrderStatus.create(request.status);

      // Get current order to validate transition
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return Result.fail(`Order ${request.orderId} not found`);
      }

      // Validate status transition
      if (!order.status.canTransitionTo(newStatus)) {
        return Result.fail(
          `Cannot transition from ${order.status.value} to ${newStatus.value}`
        );
      }

      // Update status
      await this.orderRepository.updateStatus(orderId, newStatus, request.note);

      // Get updated order
      const updatedOrder = await this.orderRepository.findById(orderId);
      if (!updatedOrder) {
        return Result.fail('Failed to get updated order');
      }

      return Result.ok(OrderMapper.toDto(updatedOrder));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to update order status');
    }
  }
}
