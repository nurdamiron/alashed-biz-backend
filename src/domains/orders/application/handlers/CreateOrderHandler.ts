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
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export class CreateOrderHandler implements UseCase<CreateOrderDto, OrderDto> {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly reserveStockHandler: ReserveStockHandler,
    private readonly notificationService: NotificationService
  ) {}

  async execute(request: CreateOrderDto): Promise<Result<OrderDto>> {
    try {
      // STEP 1: Validate stock availability BEFORE creating order
      const stockValidation = await this.validateStockAvailability(request.items);
      if (stockValidation.isFailure) {
        return Result.fail(stockValidation.error!);
      }

      // STEP 2: Create order items
      const items = request.items.map((item) =>
        OrderItem.create({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Money.create(item.unitPrice),
          discount: item.discount ? Money.create(item.discount) : undefined,
        })
      );

      // STEP 3: Create order entity
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

      // STEP 4: Save order to database
      const savedOrder = await this.orderRepository.save(order);

      // STEP 5: Reserve stock (within transaction)
      const reserveResult = await this.reserveStockHandler.execute({
        orderId: savedOrder.id!.value,
        items: request.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // If reservation fails after pre-validation, it's likely a race condition
      // The order exists but stock wasn't reserved - mark it for admin review
      if (reserveResult.isFailure) {
        // Log the issue for monitoring
        console.error(`Order ${savedOrder.id!.value} created but stock reservation failed: ${reserveResult.error}`);
        return Result.fail(`Не удалось зарезервировать товар: ${reserveResult.error}. Заказ #${savedOrder.id!.value} требует проверки.`);
      }

      // STEP 6: Send notification about new order (non-blocking)
      this.notificationService.notifyNewOrder(savedOrder.id!.value, savedOrder.employeeId).catch(console.error);

      return Result.ok(OrderMapper.toDto(savedOrder));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create order');
    }
  }

  /**
   * Pre-validates stock availability without modifying data.
   * This prevents creating orders for unavailable products.
   */
  private async validateStockAvailability(
    items: Array<{ productId: number; quantity: number }>
  ): Promise<Result<void>> {
    for (const item of items) {
      const result = await query(
        `SELECT id, name, quantity FROM products WHERE id = $1 AND is_active = true`,
        [item.productId]
      );

      if (result.rows.length === 0) {
        return Result.fail(`Товар с ID ${item.productId} не найден или неактивен`);
      }

      const product = result.rows[0];
      if (product.quantity < item.quantity) {
        return Result.fail(
          `Недостаточно товара "${product.name}". Доступно: ${product.quantity}, требуется: ${item.quantity}`
        );
      }
    }

    return Result.ok(undefined);
  }
}
