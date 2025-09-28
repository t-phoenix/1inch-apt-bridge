import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, orderSchemas, commonSchemas } from '../middleware/validation.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { getOrder, updateOrderStatus } from '../services/orderService.js';

const router = express.Router();

// Get order details
router.get('/:orderId', 
  rateLimiters.orderStatus,
  validate(commonSchemas.orderId, 'params'),
  asyncHandler(async (req, res) => {
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
  })
);

// Update order status (internal use by relayer)
router.patch('/:orderId/status', 
  rateLimiters.general,
  validate(commonSchemas.orderId, 'params'),
  validate(orderSchemas.update),
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const updates = req.body;
    
    const updatedOrder = await updateOrderStatus(orderId, updates);
    
    res.json({
      success: true,
      order: updatedOrder
    });
  })
);

export { router as orderRouter };
