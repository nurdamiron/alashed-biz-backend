import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { Order } from '../../domain/entities/Order.js';
import { OrderItem } from '../../domain/entities/OrderItem.js';
import { Money } from '../../domain/value-objects/Money.js';
import { CreateOrderDto, OrderDto } from '../dto/OrderDto.js';
import { OrderMapper } from '../mappers/OrderMapper.js';
import { ReserveStockHandler } from '../../../inventory/application/handlers/ReserveStockHandler.js';
import { NotificationService } from '../../../notifications/infrastructure/services/NotificationService.js';

export class CreateOrderHandler implements UseCase<CreateOrderDto, OrderDto> {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly reserveStockHandler: ReserveStockHandler,
    private readonly notificationService: NotificationService
  ) {}

  async execute(request: CreateOrderDto): Promise<Result<OrderDto>> {
    try {
      // Create order items
      const items = request.items.map((item) =>
        OrderItem.create({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Money.create(item.unitPrice),
          discount: item.discount ? Money.create(item.discount) : undefined,
        })
      );

      // Create order
      const order = Order.create({
        customerId: request.customerId,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        employeeId: request.employeeId,
        items,
        paymentMethod: request.paymentMethod,
        deliveryAddress: request.deliveryAddress,
        notes: request.notes,
        discount: request.discount ? Money.create(request.discount) : undefined,
      });

      // Save
      const savedOrder = await this.orderRepository.save(order);

      // Reserve stock for the order
      const reserveResult = await this.reserveStockHandler.execute({
        orderId: savedOrder.id!.value,
        items: request.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // If reservation fails, we should ideally rollback the order
      // For now, we'll return the error
      if (reserveResult.isFailure) {
        return Result.fail(`Order created but stock reservation failed: ${reserveResult.error}`);
      }

      // Send notification about new order
      await this.notificationService.notifyNewOrder(savedOrder.id!.value, savedOrder.employeeId);

      return Result.ok(OrderMapper.toDto(savedOrder));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create order');
    }
  }
}
