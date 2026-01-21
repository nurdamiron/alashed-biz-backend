import { Order } from '../../domain/entities/Order.js';
import { OrderDto, OrderItemDto } from '../dto/OrderDto.js';

export class OrderMapper {
  static toDto(order: Order): OrderDto {
    return {
      id: order.id?.value ?? 0,
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      employeeId: order.employeeId,
      items: order.items.map((item): OrderItemDto => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        discount: item.discount.amount,
        subtotal: item.subtotal.amount,
      })),
      status: order.status.value,
      totalAmount: order.totalAmount.amount,
      discount: order.discount.amount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      source: order.source || 'Магазин',
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  static toDtoList(orders: Order[]): OrderDto[] {
    return orders.map(this.toDto);
  }
}
