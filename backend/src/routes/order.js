import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getOrder, updateOrderStatus } from '../services/orderService.js';

const router = express.Router();

// Get order details
router.get('/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const order = await getOrder(orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }
  
  res.json({
    success: true,
    order
  });
}));

// Update order status (internal use by relayer)
router.patch('/:orderId/status', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, transactionHash, blockNumber } = req.body;
  
  const updatedOrder = await updateOrderStatus(orderId, {
    status,
    transactionHash,
    blockNumber
  });
  
  res.json({
    success: true,
    order: updatedOrder
  });
}));

export { router as orderRouter };
