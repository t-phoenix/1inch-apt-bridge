// 1inch API routes
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, commonSchemas } from '../middleware/validation.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { oneInchService } from '../services/oneInchService.js';

const router = express.Router();

// Get supported tokens for a chain
router.get('/tokens/:chain', 
  rateLimiters.priceRequests,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    
    const tokens = await oneInchService.getTokens(chain);
    
    res.json({
      success: true,
      chain,
      tokens
    });
  })
);

// Get token information
router.get('/tokens/:chain/:tokenAddress', 
  rateLimiters.priceRequests,
  validate(commonSchemas.chainId, 'params'),
  validate(commonSchemas.tokenAddress, 'params'),
  asyncHandler(async (req, res) => {
    const { chain, tokenAddress } = req.params;
    
    const tokenInfo = await oneInchService.getTokenInfo(chain, tokenAddress);
    
    res.json({
      success: true,
      chain,
      tokenAddress,
      tokenInfo
    });
  })
);

// Get quote for token swap
router.get('/quote/:chain', 
  rateLimiters.priceRequests,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    const { 
      fromToken, 
      toToken, 
      amount, 
      slippage = 0.5,
      fee = 0,
      gasPrice = null,
      complexityLevel = 'fast',
      connectorTokens = '',
      gasLimit = null,
      mainRouteParts = 10,
      parts = 50
    } = req.query;

    // Validate required parameters
    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount'
      });
    }

    const options = {
      slippage: parseFloat(slippage),
      fee: parseFloat(fee),
      gasPrice: gasPrice ? parseFloat(gasPrice) : null,
      complexityLevel,
      connectorTokens: connectorTokens ? connectorTokens.split(',') : [],
      gasLimit: gasLimit ? parseInt(gasLimit) : null,
      mainRouteParts: parseInt(mainRouteParts),
      parts: parseInt(parts),
    };

    const quote = await oneInchService.getQuote(chain, fromToken, toToken, amount, options);
    
    res.json({
      success: true,
      chain,
      quote
    });
  })
);

// Get swap data for execution
router.get('/swap/:chain', 
  rateLimiters.swapCreation,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    const { 
      fromToken, 
      toToken, 
      amount, 
      fromAddress,
      slippage = 0.5,
      fee = 0,
      gasPrice = null,
      complexityLevel = 'fast',
      connectorTokens = '',
      gasLimit = null,
      mainRouteParts = 10,
      parts = 50,
      referrer = null,
      allowPartialFill = false,
      disableEstimate = false,
      permit = null,
      burnChi = false,
      allowSwap = true,
      allowBurn = false
    } = req.query;

    // Validate required parameters
    if (!fromToken || !toToken || !amount || !fromAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount, fromAddress'
      });
    }

    const options = {
      fromAddress,
      slippage: parseFloat(slippage),
      fee: parseFloat(fee),
      gasPrice: gasPrice ? parseFloat(gasPrice) : null,
      complexityLevel,
      connectorTokens: connectorTokens ? connectorTokens.split(',') : [],
      gasLimit: gasLimit ? parseInt(gasLimit) : null,
      mainRouteParts: parseInt(mainRouteParts),
      parts: parseInt(parts),
      referrer,
      allowPartialFill: allowPartialFill === 'true',
      disableEstimate: disableEstimate === 'true',
      permit,
      burnChi: burnChi === 'true',
      allowSwap: allowSwap === 'true',
      allowBurn: allowBurn === 'true',
    };

    const swapData = await oneInchService.getSwapData(chain, fromToken, toToken, amount, fromAddress, options);
    
    res.json({
      success: true,
      chain,
      swapData
    });
  })
);

// Get gas price for a chain
router.get('/gas-price/:chain', 
  rateLimiters.priceRequests,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    
    const gasPrice = await oneInchService.getGasPrice(chain);
    
    res.json({
      success: true,
      chain,
      gasPrice
    });
  })
);

// Get supported protocols for a chain
router.get('/protocols/:chain', 
  rateLimiters.general,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    
    const protocols = await oneInchService.getProtocols(chain);
    
    res.json({
      success: true,
      chain,
      protocols
    });
  })
);

// Get token price in USD
router.get('/price/:chain', 
  rateLimiters.priceRequests,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    const { tokenAddress, tokenAddresses } = req.query;

    if (tokenAddresses) {
      // Get multiple token prices
      const addresses = tokenAddresses.split(',');
      const prices = await oneInchService.getTokenPrices(chain, addresses);
      
      res.json({
        success: true,
        chain,
        prices
      });
    } else if (tokenAddress) {
      // Get single token price
      const price = await oneInchService.getTokenPrice(chain, tokenAddress);
      
      res.json({
        success: true,
        chain,
        tokenAddress,
        price
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: tokenAddress or tokenAddresses'
      });
    }
  })
);

// Get approval data for token spending
router.get('/approve/:chain', 
  rateLimiters.general,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    const { tokenAddress, amount } = req.query;

    if (!tokenAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: tokenAddress, amount'
      });
    }

    const approvalData = await oneInchService.getApprovalData(chain, tokenAddress, amount);
    
    res.json({
      success: true,
      chain,
      approvalData
    });
  })
);

// Get allowance for token spending
router.get('/allowance/:chain', 
  rateLimiters.general,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    const { tokenAddress, walletAddress, spenderAddress } = req.query;

    if (!tokenAddress || !walletAddress || !spenderAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: tokenAddress, walletAddress, spenderAddress'
      });
    }

    const allowance = await oneInchService.getAllowance(chain, tokenAddress, walletAddress, spenderAddress);
    
    res.json({
      success: true,
      chain,
      allowance
    });
  })
);

// Validate if a swap is possible
router.get('/validate/:chain', 
  rateLimiters.priceRequests,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    const { fromToken, toToken, amount } = req.query;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount'
      });
    }

    const validation = await oneInchService.validateSwap(chain, fromToken, toToken, amount);
    
    res.json({
      success: true,
      chain,
      validation
    });
  })
);

// Get optimal swap route
router.get('/route/:chain', 
  rateLimiters.swapCreation,
  validate(commonSchemas.chainId, 'params'),
  asyncHandler(async (req, res) => {
    const { chain } = req.params;
    const { 
      fromToken, 
      toToken, 
      amount, 
      fromAddress,
      slippage = 0.5,
      fee = 0,
      gasPrice = null,
      complexityLevel = 'fast',
      connectorTokens = '',
      gasLimit = null,
      mainRouteParts = 10,
      parts = 50,
      referrer = null,
      allowPartialFill = false,
      disableEstimate = false,
      permit = null,
      burnChi = false,
      allowSwap = true,
      allowBurn = false
    } = req.query;

    if (!fromToken || !toToken || !amount || !fromAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount, fromAddress'
      });
    }

    const options = {
      fromAddress,
      slippage: parseFloat(slippage),
      fee: parseFloat(fee),
      gasPrice: gasPrice ? parseFloat(gasPrice) : null,
      complexityLevel,
      connectorTokens: connectorTokens ? connectorTokens.split(',') : [],
      gasLimit: gasLimit ? parseInt(gasLimit) : null,
      mainRouteParts: parseInt(mainRouteParts),
      parts: parseInt(parts),
      referrer,
      allowPartialFill: allowPartialFill === 'true',
      disableEstimate: disableEstimate === 'true',
      permit,
      burnChi: burnChi === 'true',
      allowSwap: allowSwap === 'true',
      allowBurn: allowBurn === 'true',
    };

    const route = await oneInchService.getOptimalRoute(chain, fromToken, toToken, amount, options);
    
    res.json({
      success: true,
      chain,
      route
    });
  })
);

// Get 1inch health status
router.get('/health', 
  rateLimiters.healthCheck,
  asyncHandler(async (req, res) => {
    const health = await oneInchService.getHealthStatus();
    
    res.json({
      success: true,
      health
    });
  })
);

export { router as oneInchRouter };
