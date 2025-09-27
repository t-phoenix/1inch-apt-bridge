import { logger } from '../utils/logger.js';
import { OrderService } from './orderService.js';
import { 
  generateSecret, 
  generateHash, 
  generateSwapId,
  validateHash,
  validateSecret 
} from '../utils/crypto.js';

const orderService = new OrderService();

export async function createSwapOrder(orderData) {
  try {
    logger.info('Creating swap order:', orderData);
    
    // Validate input data
    if (!orderData.makerAddress || !orderData.takerAddress) {
      throw new Error('Maker and taker addresses are required');
    }
    
    if (!orderData.fromChain || !orderData.toChain) {
      throw new Error('Source and destination chains are required');
    }
    
    if (!orderData.amount || orderData.amount <= 0) {
      throw new Error('Valid amount is required');
    }
    
    // Generate secret and hash for HTLC
    const secret = generateSecret();
    const hash = generateHash(secret);
    
    // Validate generated hash and secret
    if (!validateHash(hash)) {
      throw new Error('Generated hash is invalid');
    }
    
    if (!validateSecret(secret)) {
      throw new Error('Generated secret is invalid');
    }
    
    // Generate unique swap ID
    const swapId = generateSwapId(
      orderData.makerAddress,
      orderData.takerAddress,
      orderData.amount.toString(),
      Date.now()
    );
    
    const order = {
      id: swapId,
      makerAddress: orderData.makerAddress,
      takerAddress: orderData.takerAddress,
      fromChain: orderData.fromChain,
      toChain: orderData.toChain,
      fromToken: orderData.fromToken,
      toToken: orderData.toToken,
      amount: orderData.amount.toString(),
      secret,
      hash,
      timelock: orderData.timelock || (Math.floor(Date.now() / 1000) + 3600), // Default 1 hour
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
