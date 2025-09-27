import { logger } from '../utils/logger.js';
import { Order } from '../models/Order.js';

export class OrderService {
  async createOrder(orderData) {
    try {
      const order = await Order.create(orderData);
      logger.info(`Order created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Failed to create order:', error);
      throw error;
    }
  }

  async getOrder(orderId) {
    try {
      const order = await Order.findByPk(orderId, {
        include: ['escrows', 'transactions']
      });
      return order;
    } catch (error) {
      logger.error(`Failed to get order ${orderId}:`, error);
      throw error;
    }
  }

  async updateOrder(orderId, updates) {
    try {
      const [affectedRows] = await Order.update(updates, {
        where: { id: orderId },
        returning: true
      });
      
      if (affectedRows === 0) {
        throw new Error(`Order ${orderId} not found`);
      }
      
      const updatedOrder = await Order.findByPk(orderId, {
        include: ['escrows', 'transactions']
      });
      
      logger.info(`Order updated: ${orderId}`);
      return updatedOrder;
    } catch (error) {
      logger.error(`Failed to update order ${orderId}:`, error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, statusData) {
    return this.updateOrder(orderId, statusData);
  }

  async deleteOrder(orderId) {
    try {
      const deleted = await Order.destroy({
        where: { id: orderId }
      });
      
      if (deleted) {
        logger.info(`Order deleted: ${orderId}`);
      }
      
      return deleted > 0;
    } catch (error) {
      logger.error(`Failed to delete order ${orderId}:`, error);
      throw error;
    }
  }

  async getAllOrders(options = {}) {
    try {
      const { limit = 100, offset = 0, status, fromChain, toChain } = options;
      
      const where = {};
      if (status) where.status = status;
      if (fromChain) where.fromChain = fromChain;
      if (toChain) where.toChain = toChain;
      
      const orders = await Order.findAndCountAll({
        where,
        include: ['escrows', 'transactions'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      return orders;
    } catch (error) {
      logger.error('Failed to get all orders:', error);
      throw error;
    }
  }

  async getOrdersByMaker(makerAddress, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const orders = await Order.findAndCountAll({
        where: { makerAddress },
        include: ['escrows', 'transactions'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      return orders;
    } catch (error) {
      logger.error(`Failed to get orders for maker ${makerAddress}:`, error);
      throw error;
    }
  }

  async getOrdersByTaker(takerAddress, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const orders = await Order.findAndCountAll({
        where: { takerAddress },
        include: ['escrows', 'transactions'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      return orders;
    } catch (error) {
      logger.error(`Failed to get orders for taker ${takerAddress}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const orderService = new OrderService();

// Export individual functions for easier importing
export const createOrder = (orderData) => orderService.createOrder(orderData);
export const getOrder = (orderId) => orderService.getOrder(orderId);
export const updateOrder = (orderId, updates) => orderService.updateOrder(orderId, updates);
export const updateOrderStatus = (orderId, statusData) => orderService.updateOrderStatus(orderId, statusData);
export const deleteOrder = (orderId) => orderService.deleteOrder(orderId);
export const getAllOrders = (options) => orderService.getAllOrders(options);
export const getOrdersByMaker = (makerAddress, options) => orderService.getOrdersByMaker(makerAddress, options);
export const getOrdersByTaker = (takerAddress, options) => orderService.getOrdersByTaker(takerAddress, options);
