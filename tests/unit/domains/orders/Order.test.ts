import { describe, it, expect } from 'vitest';
import { Order } from '@/domains/orders/domain/entities/Order.js';
import { OrderStatus } from '@/domains/orders/domain/value-objects/OrderStatus.js';
import { OrderItem } from '@/domains/orders/domain/entities/OrderItem.js';
import { Money } from '@/domains/orders/domain/value-objects/Money.js';

describe('Order Entity', () => {
    const createValidItem = (price = 50000) =>
        OrderItem.create({
            productId: 1,
            quantity: 2,
            unitPrice: Money.create(price),
            productName: 'Test Product'
        });

    it('should create order with correct total amount', () => {
        const items = [createValidItem(50000)]; // 2 * 50000 = 100000

        const order = Order.create({
            customerId: 1,
            customerName: 'Test User',
            customerPhone: '+77001234567',
            items,
            discount: Money.create(10000)
        });

        // Total: 100000 - 10000 = 90000
        expect(order.totalAmount.amount).toBe(90000);
        expect(order.status.value).toBe('pending');
        expect(order.paymentStatus).toBe('unpaid');
    });

    it('should not allow creating order without items', () => {
        expect(() => {
            Order.create({
                customerId: 1,
                customerName: 'Test User',
                customerPhone: '+77001234567',
                items: []
            });
        }).toThrow('Order must have at least one item');
    });

    it('should allow valid status transition', () => {
        const order = Order.create({
            customerId: 1,
            customerName: 'Test User',
            customerPhone: '+77001234567',
            items: [createValidItem()]
        });

        // Pending -> Confirmed (Valid)
        const confirmedStatus = OrderStatus.create('confirmed');
        order.changeStatus(confirmedStatus);

        expect(order.status.value).toBe('confirmed');
    });

    it('should prevent invalid status transition', () => {
        const order = Order.create({
            customerId: 1,
            customerName: 'Test User',
            customerPhone: '+77001234567',
            items: [createValidItem()]
        });

        // Pending -> Delivered (Invalid, must go through confirmed -> in_progress -> etc)
        // OrderStatus: pending -> [confirmed, cancelled]
        expect(() => {
            order.changeStatus(OrderStatus.create('delivered'));
        }).toThrow();
    });
});
