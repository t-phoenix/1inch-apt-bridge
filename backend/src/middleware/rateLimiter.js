// Rate limiting middleware
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// Rate limiter configuration
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip,
    skip = (req) => false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator,
    skip
  });
};

// Different rate limits for different endpoints
export const rateLimiters = {
  // General API rate limit
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later.'
  }),

  // Strict rate limit for swap creation
  swapCreation: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 swap creations per 5 minutes
    message: 'Too many swap creation attempts, please try again later.',
    keyGenerator: (req) => `${req.ip}-${req.body.makerAddress || 'anonymous'}`
  }),

  // Rate limit for price requests
  priceRequests: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 price requests per minute
    message: 'Too many price requests, please try again later.'
  }),

  // Rate limit for order status checks
  orderStatus: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 status checks per minute
    message: 'Too many status check requests, please try again later.'
  }),

  // Very strict rate limit for sensitive operations
  sensitive: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 sensitive operations per 15 minutes
    message: 'Too many sensitive operations, please try again later.',
    keyGenerator: (req) => `${req.ip}-${req.body.makerAddress || 'anonymous'}`
  }),

  // Rate limit for health checks (more lenient)
  healthCheck: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 health checks per minute
    message: 'Too many health check requests, please try again later.'
  })
};

// Dynamic rate limiter based on user tier
export const createDynamicRateLimiter = (tier = 'standard') => {
  const limits = {
    premium: {
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Premium rate limit exceeded'
    },
    standard: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Standard rate limit exceeded'
    },
    basic: {
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: 'Basic rate limit exceeded'
    }
  };

  return createRateLimiter(limits[tier] || limits.standard);
};

// Rate limiter for specific IP addresses (whitelist/blacklist)
export const createIPBasedRateLimiter = (ipLimits = {}) => {
  return (req, res, next) => {
    const ip = req.ip;
    const limit = ipLimits[ip];
    
    if (limit) {
      const limiter = createRateLimiter(limit);
      return limiter(req, res, next);
    }
    
    // Use default rate limiter
    return rateLimiters.general(req, res, next);
  };
};

// Rate limiter with exponential backoff
export const createExponentialBackoffLimiter = (baseDelay = 1000) => {
  return (req, res, next) => {
    const key = `backoff-${req.ip}`;
    const now = Date.now();
    
    if (requestCounts.has(key)) {
      const lastRequest = requestCounts.get(key);
      const timeSinceLastRequest = now - lastRequest;
      const delay = Math.min(baseDelay * Math.pow(2, lastRequest.attempts || 0), 30000); // Max 30 seconds
      
      if (timeSinceLastRequest < delay) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded, please wait before trying again',
          retryAfter: Math.ceil((delay - timeSinceLastRequest) / 1000)
        });
      }
      
      requestCounts.set(key, { timestamp: now, attempts: (lastRequest.attempts || 0) + 1 });
    } else {
      requestCounts.set(key, { timestamp: now, attempts: 0 });
    }
    
    next();
  };
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, value] of requestCounts.entries()) {
    if (Array.isArray(value)) {
      // For rate limiting entries
      const validRequests = value.filter(timestamp => now - timestamp < maxAge);
      if (validRequests.length === 0) {
        requestCounts.delete(key);
      } else {
        requestCounts.set(key, validRequests);
      }
    } else if (value.timestamp && now - value.timestamp > maxAge) {
      // For backoff entries
      requestCounts.delete(key);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour

export default rateLimiters;
