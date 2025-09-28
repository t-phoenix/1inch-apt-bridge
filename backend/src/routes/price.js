// Price API routes
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, commonSchemas } from '../middleware/validation.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { priceService } from '../services/priceService.js';

const router = express.Router();

// Get token price
router.get('/:chain/:tokenAddress', 
  rateLimiters.priceRequests,
  validate(commonSchemas.chainId, 'params'),
  validate(commonSchemas.tokenAddress, 'params'),
  asyncHandler(async (req, res) => {
    const { chain, tokenAddress } = req.params;
    const { currency = 'usd' } = req.query;
    
    const price = await priceService.getTokenPrice(chain, tokenAddress, currency);
    
    res.json({
      success: true,
      chain,
      tokenAddress,
      currency: currency.toUpperCase(),
      price
    });
  })
);

// Get multiple token prices
router.post('/batch', 
  rateLimiters.priceRequests,
  asyncHandler(async (req, res) => {
    const { requests } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid requests array'
      });
    }

    if (requests.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Too many requests (max 50)'
      });
    }

    const prices = await priceService.getMultipleTokenPrices(requests);
    
    res.json({
      success: true,
      prices
    });
  })
);

// Get token price history
router.get('/history/:tokenId', 
  rateLimiters.priceRequests,
  asyncHandler(async (req, res) => {
    const { tokenId } = req.params;
    const { days = 7, currency = 'usd' } = req.query;
    
    const history = await priceService.getTokenPriceHistory(tokenId, parseInt(days), currency);
    
    res.json({
      success: true,
      tokenId,
      currency: currency.toUpperCase(),
      history
    });
  })
);

// Get trending tokens
router.get('/trending', 
  rateLimiters.priceRequests,
  asyncHandler(async (req, res) => {
    const trending = await priceService.getTrendingTokens();
    
    res.json({
      success: true,
      trending
    });
  })
);

// Get market data for a token
router.get('/market/:tokenId', 
  rateLimiters.priceRequests,
  asyncHandler(async (req, res) => {
    const { tokenId } = req.params;
    const { currency = 'usd' } = req.query;
    
    const marketData = await priceService.getMarketData(tokenId, currency);
    
    res.json({
      success: true,
      tokenId,
      currency: currency.toUpperCase(),
      marketData
    });
  })
);

// Get cache statistics
router.get('/cache/stats', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    const stats = priceService.getCacheStats();
    
    res.json({
      success: true,
      cache: stats
    });
  })
);

// Clear price cache
router.delete('/cache', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    priceService.clearCache();
    
    res.json({
      success: true,
      message: 'Price cache cleared'
    });
  })
);

export { router as priceRouter };
