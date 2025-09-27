import { logger } from '../utils/logger.js';

export class OrderService {
  constructor() {
    // In-memory storage for now, will be replaced with database
    this.orders = new Map();
  }

  async createOrder(orderData) {
    const orderId = this.generateOrderId();
    const order = {
      id: orderId,
      ...orderData
    };
    
    this.orders.set(orderId, order);
    logger.info(`Order created: ${orderId}`);
    
    return order;
  }

  async getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  async updateOrder(orderId, updates) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const updatedOrder = {
      ...order,
      ...updates,
      updatedAt: new Date()
    };
    
    this.orders.set(orderId, updatedOrder);
    logger.info(`Order updated: ${orderId}`);
    
    return updatedOrder;
  }

  async updateOrderStatus(orderId, statusData) {
    return this.updateOrder(orderId, statusData);
  }

  async deleteOrder(orderId) {
    const deleted = this.orders.delete(orderId);
    if (deleted) {
      logger.info(`Order deleted: ${orderId}`);
    }
    return deleted;
  }

  async getAllOrders() {
    return Array.from(this.orders.values());
  }

  generateOrderId() {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
