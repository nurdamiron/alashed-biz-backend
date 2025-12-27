import { Order } from '../entities/Order.js';
import { OrderId } from '../value-objects/OrderId.js';
import { OrderStatus } from '../value-objects/OrderStatus.js';

export interface OrderFilters {
  status?: OrderStatus;
  customerId?: number;
  employeeId?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface IOrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findAll(filters?: OrderFilters, pagination?: PaginationParams): Promise<Order[]>;
  search(query: string): Promise<Order[]>;
  save(order: Order): Promise<Order>;
  updateStatus(id: OrderId, status: OrderStatus, note?: string): Promise<void>;
  count(filters?: OrderFilters): Promise<number>;
}
