// Input validation middleware using Joi
import Joi from 'joi';
import { logger } from '../utils/logger.js';

// Common validation schemas
export const commonSchemas = {
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  aptosAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  amount: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
  chainId: Joi.string().valid('ethereum', 'polygon', 'aptos').required(),
  tokenAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$|^0x[a-fA-F0-9]{64}$/).required(),
  timelock: Joi.number().integer().min(300).max(86400).required(), // 5 minutes to 24 hours
  hash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  secret: Joi.string().pattern(/^[a-fA-F0-9]{64}$/).required(),
  orderId: Joi.string().pattern(/^[a-fA-F0-9]{64}$/).required(),
  swapId: Joi.string().pattern(/^[a-fA-F0-9]{64}$/).required(),
};

// Validation middleware factory
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn(`Validation error for ${property}:`, errorMessage);
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req[property] = value;
    next();
  };
};

// Specific validation schemas
export const orderSchemas = {
  create: Joi.object({
    makerAddress: commonSchemas.address,
    takerAddress: commonSchemas.address,
    fromChain: commonSchemas.chainId,
    toChain: commonSchemas.chainId,
    fromToken: commonSchemas.tokenAddress,
    toToken: commonSchemas.tokenAddress,
    amount: commonSchemas.amount,
    timelock: commonSchemas.timelock,
    slippage: Joi.number().min(0.1).max(50).default(0.5), // 0.1% to 50%
    deadline: Joi.number().integer().min(5).max(60).default(20), // 5 to 60 minutes
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'escrowed', 'completed', 'failed', 'refunded').optional(),
    fromChainTxHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional(),
    toChainTxHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional(),
    completedAt: Joi.date().optional(),
  }).min(1), // At least one field must be provided
};

export const swapSchemas = {
  create: Joi.object({
    orderId: commonSchemas.orderId,
    fromChain: commonSchemas.chainId,
    toChain: commonSchemas.chainId,
    fromToken: commonSchemas.tokenAddress,
    toToken: commonSchemas.tokenAddress,
    amount: commonSchemas.amount,
    recipientAddress: commonSchemas.address,
    timelock: commonSchemas.timelock,
  }),

  redeem: Joi.object({
    swapId: commonSchemas.swapId,
    preimage: commonSchemas.secret,
  }),

  refund: Joi.object({
    swapId: commonSchemas.swapId,
  }),
};

export const escrowSchemas = {
  create: Joi.object({
    orderId: commonSchemas.orderId,
    chain: commonSchemas.chainId,
    makerAddress: commonSchemas.address,
    recipientAddress: commonSchemas.address,
    tokenAddress: commonSchemas.tokenAddress,
    amount: commonSchemas.amount,
    hashlock: commonSchemas.hash,
    timelock: commonSchemas.timelock,
    safetyDeposit: commonSchemas.amount,
  }),
};

export const priceSchemas = {
  getPrice: Joi.object({
    tokenAddress: commonSchemas.tokenAddress,
    chain: commonSchemas.chainId,
    currency: Joi.string().valid('USD', 'EUR', 'BTC', 'ETH').default('USD'),
  }),
};

// Query parameter validation
export const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'amount', 'status').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  orderFilter: Joi.object({
    status: Joi.string().valid('pending', 'escrowed', 'completed', 'failed', 'refunded').optional(),
    fromChain: commonSchemas.chainId.optional(),
    toChain: commonSchemas.chainId.optional(),
    makerAddress: commonSchemas.address.optional(),
    takerAddress: commonSchemas.address.optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
  }),
};

// Sanitization middleware
export const sanitize = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  // Sanitize all string fields in body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
};

// Custom validation for cross-chain swaps
export const validateCrossChainSwap = (req, res, next) => {
  const { fromChain, toChain } = req.body;
  
  if (fromChain === toChain) {
    return res.status(400).json({
      success: false,
      error: 'Cross-chain swap requires different source and destination chains'
    });
  }

  // Validate supported chain pairs
  const supportedPairs = [
    ['ethereum', 'aptos'],
    ['aptos', 'ethereum'],
    ['polygon', 'aptos'],
    ['aptos', 'polygon'],
    ['ethereum', 'polygon'],
    ['polygon', 'ethereum']
  ];

  const isValidPair = supportedPairs.some(([from, to]) => 
    from === fromChain && to === toChain
  );

  if (!isValidPair) {
    return res.status(400).json({
      success: false,
      error: `Unsupported chain pair: ${fromChain} → ${toChain}`,
      supportedPairs: supportedPairs.map(([from, to]) => `${from} → ${to}`)
    });
  }

  next();
};
