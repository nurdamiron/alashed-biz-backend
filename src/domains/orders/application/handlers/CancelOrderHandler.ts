import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { OrderId } from '../../domain/value-objects/OrderId.js';
import { OrderStatus } from '../../domain/value-objects/OrderStatus.js';
import { OrderDto } from '../dto/OrderDto.js';
import { OrderMapper } from '../mappers/OrderMapper.js';
import { ReleaseStockHandler } from '../../../inventory/application/handlers/ReleaseStockHandler.js';

export interface CancelOrderRequest {
  orderId: number;
  reason?: string;
}

/**
 * Отменяет заказ и возвращает товары на склад
 */
export class CancelOrderHandler implements UseCase<CancelOrderRequest, OrderDto> {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly releaseStockHandler: ReleaseStockHandler
  ) {}

  async execute(request: CancelOrderRequest): Promise<Result<OrderDto>> {
    try {
      const orderId = OrderId.create(request.orderId);

      // Get current order
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return Result.fail(`Order ${request.orderId} not found`);
      }

      // Check if can be cancelled
      if (order.status.value === 'delivered') {
        return Result.fail('Cannot cancel a delivered order. Use refund instead.');
      }

      if (order.status.value === 'cancelled') {
        return Result.fail('Order is already cancelled');
      }

      // Update status to cancelled
      const cancelledStatus = OrderStatus.create('cancelled');
      await this.orderRepository.updateStatus(
        orderId,
        cancelledStatus,
        request.reason || 'Заказ отменен'
      );

      // Release stock back to inventory
      const releaseResult = await this.releaseStockHandler.execute({
        orderId: request.orderId,
        reason: request.reason || 'Заказ отменен',
      });

      if (releaseResult.isFailure) {
        return Result.fail(
          `Order cancelled but failed to release stock: ${releaseResult.error}`
        );
      }

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
      return Result.fail('Failed to cancel order');
    }
  }
}
