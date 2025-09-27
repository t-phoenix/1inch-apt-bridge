import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createSwapOrder, getSwapStatus } from '../services/swapService.js';

const router = express.Router();

// Create a new cross-chain swap order
router.post('/create', asyncHandler(async (req, res) => {
  const { makerAddress, takerAddress, fromChain, toChain, fromToken, toToken, amount, timelock } = req.body;
  
  const order = await createSwapOrder({
    makerAddress,
    takerAddress,
    fromChain,
    toChain,
    fromToken,
    toToken,
    amount,
    timelock
  });
  
  res.status(201).json({
    success: true,
    orderId: order.id,
    order
  });
}));

// Get swap status
router.get('/status/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const status = await getSwapStatus(orderId);
  
  res.json({
    success: true,
    status
  });
}));

export { router as swapRouter };
