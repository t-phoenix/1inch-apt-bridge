import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, swapSchemas, commonSchemas, validateCrossChainSwap } from '../middleware/validation.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { createSwapOrder, getSwapStatus } from '../services/swapService.js';

const router = express.Router();

// Create a new cross-chain swap order
router.post('/create', 
  rateLimiters.swapCreation,
  validate(swapSchemas.create),
  validateCrossChainSwap,
  asyncHandler(async (req, res) => {
    const { orderId, fromChain, toChain, fromToken, toToken, amount, recipientAddress, timelock } = req.body;
    
    const order = await createSwapOrder({
      orderId,
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      recipientAddress,
      timelock
    });
    
    res.status(201).json({
      success: true,
      orderId: order.id,
      order
    });
  })
);

// Get swap status
router.get('/status/:orderId', 
  rateLimiters.orderStatus,
  validate(commonSchemas.orderId, 'params'),
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    
    const status = await getSwapStatus(orderId);
    
    res.json({
      success: true,
      status
    });
  })
);

// Redeem swap with preimage
router.post('/redeem',
  rateLimiters.sensitive,
  validate(swapSchemas.redeem),
  asyncHandler(async (req, res) => {
    const { swapId, preimage } = req.body;
    
    // This will be implemented when we add the redemption logic
    res.json({
      success: true,
      message: 'Redemption initiated',
      swapId
    });
  })
);

// Refund swap
router.post('/refund',
  rateLimiters.sensitive,
  validate(swapSchemas.refund),
  asyncHandler(async (req, res) => {
    const { swapId } = req.body;
    
    // This will be implemented when we add the refund logic
    res.json({
      success: true,
      message: 'Refund initiated',
      swapId
    });
  })
);

export { router as swapRouter };
