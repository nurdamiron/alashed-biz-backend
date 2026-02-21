import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { IOrderRepository, OrderFilters, PaginationParams } from '../../domain/repositories/IOrderRepository.js';
import { Order } from '../../domain/entities/Order.js';
import { OrderItem } from '../../domain/entities/OrderItem.js';
import { OrderId } from '../../domain/value-objects/OrderId.js';
import { OrderStatus } from '../../domain/value-objects/OrderStatus.js';

export class PostgresOrderRepository implements IOrderRepository {
  async findById(id: OrderId): Promise<Order | null> {
    const orderResult = await query(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1`,
      [id.value]
    );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const itemsResult = await query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id.value]
    );

    const items = itemsResult.rows.map((row) => OrderItem.fromPersistence(row));
    return Order.fromPersistence(orderResult.rows[0], items);
  }

  async findAll(filters?: OrderFilters, pagination?: PaginationParams): Promise<Order[]> {
    let sql = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      sql += ` AND o.status = $${paramIndex++}`;
      params.push(filters.status.value);
    }

    if (filters?.customerId) {
      sql += ` AND o.customer_id = $${paramIndex++}`;
      params.push(filters.customerId);
    }

    if (filters?.employeeId) {
      sql += ` AND o.employee_id = $${paramIndex++}`;
      params.push(filters.employeeId);
    }

    if (filters?.fromDate) {
      sql += ` AND o.created_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters?.toDate) {
      sql += ` AND o.created_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    sql += ` ORDER BY o.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(pagination.limit, pagination.offset);
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return [];
    }

    // Batch fetch items for all orders
    const orderIds = result.rows.map((r) => r.id);
    const itemsResult = await query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ANY($1)`,
      [orderIds]
    );

    const itemsByOrder = this.groupItemsByOrder(itemsResult.rows);

    return result.rows.map((row) => {
      const items = (itemsByOrder.get(row.id) || []).map((i) => OrderItem.fromPersistence(i));
      return Order.fromPersistence(row, items);
    });
  }

  async search(searchQuery: string): Promise<Order[]> {
    const result = await query(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE c.name ILIKE $1 OR c.phone ILIKE $1 OR o.id::text LIKE $1
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [`%${searchQuery}%`]
    );

    if (result.rows.length === 0) {
      return [];
    }

    const orderIds = result.rows.map((r) => r.id);
    const itemsResult = await query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ANY($1)`,
      [orderIds]
    );

    const itemsByOrder = this.groupItemsByOrder(itemsResult.rows);

    return result.rows.map((row) => {
      const items = (itemsByOrder.get(row.id) || []).map((i) => OrderItem.fromPersistence(i));
      return Order.fromPersistence(row, items);
    });
  }

  async save(order: Order): Promise<Order> {
    return transaction(async (client) => {
      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (customer_id, employee_id, status, total_amount, discount,
         payment_method, payment_status, delivery_address, notes, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          order.customerId,
          order.employeeId,
          order.status.value,
          order.totalAmount.amount,
          order.discount.amount,
          order.paymentMethod,
          order.paymentStatus,
          order.deliveryAddress,
          order.notes,
          order.source || 'Магазин',
          order.createdAt,
          order.updatedAt,
        ]
      );

      const orderId = orderResult.rows[0].id;

      // Insert items
      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            orderId,
            item.productId,
            item.quantity,
            item.unitPrice.amount,
            item.discount.amount,
            item.subtotal.amount,
          ]
        );
      }

      // Insert status history
      await client.query(
        `INSERT INTO order_status_history (order_id, new_status, changed_at)
         VALUES ($1, $2, NOW())`,
        [orderId, order.status.value]
      );

      // Return updated order
      order.setId(OrderId.create(orderId));
      return order;
    });
  }

  async updateStatus(id: OrderId, status: OrderStatus, note?: string): Promise<void> {
    await transaction(async (client) => {
      // Get current status
      const current = await client.query(
        `SELECT status FROM orders WHERE id = $1`,
        [id.value]
      );

      if (current.rows.length === 0) {
        throw new Error(`Order ${id.value} not found`);
      }

      const oldStatus = current.rows[0].status;

      // Update order
      await client.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status.value, id.value]
      );

      // Insert status history
      await client.query(
        `INSERT INTO order_status_history (order_id, old_status, new_status, note, changed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id.value, oldStatus, status.value, note]
      );
    });
  }

  async count(filters?: OrderFilters): Promise<number> {
    let sql = `SELECT COUNT(*) FROM orders WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(filters.status.value);
    }

    if (filters?.customerId) {
      sql += ` AND customer_id = $${paramIndex++}`;
      params.push(filters.customerId);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10);
  }

  private groupItemsByOrder(items: any[]): Map<number, any[]> {
    const map = new Map<number, any[]>();
    for (const item of items) {
      const orderId = item.order_id;
      if (!map.has(orderId)) {
        map.set(orderId, []);
      }
      map.get(orderId)!.push(item);
    }
    return map;
  }
}
