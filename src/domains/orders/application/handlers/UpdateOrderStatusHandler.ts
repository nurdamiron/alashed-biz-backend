import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { OrderId } from '../../domain/value-objects/OrderId.js';
import { OrderStatus } from '../../domain/value-objects/OrderStatus.js';
import { UpdateOrderStatusDto, OrderDto } from '../dto/OrderDto.js';
import { OrderMapper } from '../mappers/OrderMapper.js';
import { CompleteStockReservationHandler } from '../../../inventory/application/handlers/CompleteStockReservationHandler.js';
import { ReleaseStockHandler } from '../../../inventory/application/handlers/ReleaseStockHandler.js';
import { CreateFiscalReceiptHandler } from '../../../fiscal/application/handlers/CreateFiscalReceiptHandler.js';

export class UpdateOrderStatusHandler implements UseCase<UpdateOrderStatusDto, OrderDto> {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly completeStockReservationHandler: CompleteStockReservationHandler,
    private readonly releaseStockHandler: ReleaseStockHandler,
    private readonly createFiscalReceiptHandler: CreateFiscalReceiptHandler
  ) {}

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

      // Handle stock operations based on new status
      if (newStatus.value === 'delivered') {
        // Complete stock reservation (товар уже списан при создании заказа)
        const completeResult = await this.completeStockReservationHandler.execute({
          orderId: request.orderId,
        });

        if (completeResult.isFailure) {
          console.error('Failed to complete stock reservation:', completeResult.error);
        }

        // Автоматически создать фискальный чек
        const fiscalResult = await this.createFiscalReceiptHandler.execute({
          orderId: request.orderId,
          cashierId: request.cashierId || 1, // TODO: получать из context
        });

        if (fiscalResult.isFailure) {
          console.error('Failed to create fiscal receipt:', fiscalResult.error);
          // Не блокируем смену статуса если фискализация не удалась
        }
      } else if (newStatus.value === 'cancelled') {
        // Release stock back to inventory
        const releaseResult = await this.releaseStockHandler.execute({
          orderId: request.orderId,
          reason: request.note || 'Заказ отменен',
        });

        if (releaseResult.isFailure) {
          return Result.fail(`Status updated but failed to release stock: ${releaseResult.error}`);
        }
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
      return Result.fail('Failed to update order status');
    }
  }
}
