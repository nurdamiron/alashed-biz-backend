export interface OrderItemDto {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface OrderDto {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  employeeId?: number;
  items: OrderItemDto[];
  status: string;
  totalAmount: number;
  discount: number;
  paymentMethod?: string;
  paymentStatus: string;
  deliveryAddress?: string;
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemDto {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateOrderDto {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  employeeId?: number;
  items: CreateOrderItemDto[];
  paymentMethod?: string;
  deliveryAddress?: string;
  notes?: string;
  discount?: number;
  source?: string;
}

export interface UpdateOrderStatusDto {
  orderId: number;
  status: string;
  note?: string;
  cashierId?: number; // Для автоматической фискализации при delivered
}

export interface OrdersListDto {
  orders: OrderDto[];
  total: number;
}

export interface GetOrdersQueryDto {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface SearchOrdersQueryDto {
  query: string;
}
