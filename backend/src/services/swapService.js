import { logger } from '../utils/logger.js';
import { OrderService } from './orderService.js';
import { generateSecret, generateHash } from '../utils/crypto.js';

const orderService = new OrderService();

export async function createSwapOrder(orderData) {
  try {
    logger.info('Creating swap order:', orderData);
    
    // Generate secret and hash for HTLC
    const secret = generateSecret();
    const hash = generateHash(secret);
    
    const order = {
      ...orderData,
      secret,
      hash,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const savedOrder = await orderService.createOrder(order);
    
    logger.info(`Swap order created: ${savedOrder.id}`);
    return savedOrder;
    
  } catch (error) {
    logger.error('Failed to create swap order:', error);
    throw error;
  }
}

export async function getSwapStatus(orderId) {
  try {
    const order = await orderService.getOrder(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    return {
      orderId: order.id,
      status: order.status,
      fromChain: order.fromChain,
      toChain: order.toChain,
      amount: order.amount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
    
  } catch (error) {
    logger.error(`Failed to get swap status for order ${orderId}:`, error);
    throw error;
  }
}
