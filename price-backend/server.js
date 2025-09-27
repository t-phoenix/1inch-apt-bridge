import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// 🔥 PRICE CACHING & RATE LIMITING
const priceCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds cache
const COINGECKO_RATE_LIMIT = 1000; // 1 second between calls
let lastCoinGeckoCall = 0;

/**
 * 🔥 CACHED & RATE-LIMITED APTOS PRICE FETCHER
 * Respects CoinGecko rate limits with intelligent caching
 */
async function fetchRealAptosPrices(tokens = ['APT', 'USDC']) {
  const cacheKey = tokens.sort().join(',');
  
  // Check cache first
  const cached = priceCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log(`💾 Using cached Aptos prices for [${tokens.join(', ')}]`);
    return cached.data;
  }

  const results = [];
  
  try {
    console.log(`🦎 Fetching fresh Aptos prices for [${tokens.join(', ')}]...`);
    
    // Rate limiting: Wait if needed
    const timeSinceLastCall = Date.now() - lastCoinGeckoCall;
    if (timeSinceLastCall < COINGECKO_RATE_LIMIT) {
      const waitTime = COINGECKO_RATE_LIMIT - timeSinceLastCall;
      console.log(`⏱️  Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    const coinGeckoIds = {
      'APT': 'aptos',
      'USDC': 'usd-coin',
      'USDT': 'tether'
    };
    
    // Batch request for efficiency
    const tokenIds = tokens
      .map(symbol => coinGeckoIds[symbol.toUpperCase()])
      .filter(Boolean);
    
    if (tokenIds.length === 0) {
      throw new Error('No valid tokens to fetch');
    }
    
    const batchUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true`;
    console.log(`🌐 CoinGecko batch URL: ${batchUrl}`);
    
    // Update rate limit tracker
    lastCoinGeckoCall = Date.now();
    
    const response = await fetch(batchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': '1inch-apt-bridge/1.0.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 CoinGecko response:`, data);
    
    // Process results
    for (const symbol of tokens) {
      const geckoId = coinGeckoIds[symbol.toUpperCase()];
      if (!geckoId || !data[geckoId]) {
        console.warn(`⚠️  No data for ${symbol}, using fallback`);
        const fallbackPrice = await fetchAptosFallbackPrice(symbol);
        results.push(fallbackPrice);
        continue;
      }
      
      const price = data[geckoId].usd;
      const change24h = data[geckoId].usd_24h_change || 0;
      
      console.log(`✅ ${symbol}: $${price} (24h: ${change24h.toFixed(2)}%)`);
      
      results.push({
        symbol: symbol.toUpperCase(),
        address: TOKEN_ADDRESSES.APTOS[symbol.toUpperCase()] || `aptos_${symbol.toLowerCase()}`,
        price: price,
        change24h: change24h,
        source: 'coingecko',
        timestamp: Date.now()
      });
    }
    
    // Cache successful results
    priceCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });
    
    console.log(`💾 Cached Aptos prices for ${CACHE_DURATION/1000}s`);
    return results;
    
  } catch (error) {
    console.error('❌ CoinGecko API failed:', error.message);
    
    // Try to return cached data even if expired
    if (cached) {
      console.log('🔄 Using stale cache due to API failure');
      return cached.data;
    }
    
    // Ultimate fallback: Use known good prices
    console.log('🆘 Using ultimate fallback prices');
    return tokens.map(symbol => ({
      symbol: symbol.toUpperCase(),
      address: TOKEN_ADDRESSES.APTOS[symbol.toUpperCase()] || `aptos_${symbol.toLowerCase()}`,
      price: getLastKnownAptosPrices(symbol),
      change24h: 0,
      source: 'emergency_fallback',
      timestamp: Date.now()
    }));
  }
}

/**
 * Fallback Aptos price sources (only used when CoinGecko completely fails)
 */
async function fetchAptosFallbackPrice(symbol) {
  console.log(`🔄 Using fallback for ${symbol}...`);
  
  // Use recent real prices (updated manually)
  const fallbackPrices = {
    'APT': 4.13,  // ✅ Last known good APT price
    'USDC': 1.0,
    'USDT': 1.0
  };
  
  return {
    symbol: symbol.toUpperCase(),
    address: TOKEN_ADDRESSES.APTOS[symbol.toUpperCase()] || `aptos_${symbol.toLowerCase()}`,
    price: fallbackPrices[symbol.toUpperCase()] || 1.0,
    change24h: 0,
    source: 'fallback_static',
    timestamp: Date.now()
  };
}

/**
 * Emergency fallback prices (updated Sept 27, 2025)
 */
function getLastKnownAptosPrices(symbol) {
  const lastKnownPrices = {
    'APT': 4.13,    // ✅ Real APT price from CoinGecko
    'USDC': 1.0,    // ✅ Stable
    'USDT': 1.0     // ✅ Stable
  };
  
  return lastKnownPrices[symbol.toUpperCase()] || 1.0;
}

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cacheSize: priceCache.size,
    lastCoinGeckoCall: lastCoinGeckoCall ? new Date(lastCoinGeckoCall).toISOString() : 'never'
  });
});

// Clear price cache (for development)
app.post('/api/clear-cache', (req, res) => {
  const cacheSize = priceCache.size;
  priceCache.clear();
  console.log(`🧹 Price cache cleared (${cacheSize} entries removed)`);
  
  res.json({
    success: true,
    message: `Cache cleared (${cacheSize} entries removed)`,
    timestamp: new Date().toISOString()
  });
});

// Test 1inch API - get all prices for whitelisted tokens
app.get('/api/test', async (req, res) => {
  try {
    const apiKey = process.env.ONEINCH_API_KEY;
    const testUrl = `https://api.1inch.dev/price/v1.1/137`;
    
    console.log(`Testing 1inch API: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log(`Test response: ${response.status} - First 200 chars: ${responseText.substring(0, 200)}...`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      const tokenCount = Object.keys(data).length;
      
      // Look for MATIC/WMATIC/POL in the response
      const relevantTokens = {};
      Object.keys(data).forEach(address => {
        if (address.toLowerCase() === TOKEN_ADDRESSES.POLYGON.WMATIC.toLowerCase()) {
          relevantTokens.WMATIC = { address, price: data[address] };
        }
        if (address.toLowerCase() === TOKEN_ADDRESSES.POLYGON.POL.toLowerCase()) {
          relevantTokens.POL = { address, price: data[address] };
        }
        if (address.toLowerCase() === TOKEN_ADDRESSES.POLYGON.USDC.toLowerCase()) {
          relevantTokens.USDC = { address, price: data[address] };
        }
      });

      res.json({
        success: true,
        tokenCount,
        relevantTokens,
        sampleAddresses: Object.keys(data).slice(0, 10)
      });
    } else {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
  } catch (error) {
    console.error('Test API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all available tokens from 1inch API
app.get('/api/tokens', async (req, res) => {
  try {
    const { chainId = 137 } = req.query;
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    const url = `https://api.1inch.dev/price/v1.1/${chainId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status}`);
    }

    const allPrices = await response.json();
    
    // Return all token addresses and prices
    const tokens = Object.keys(allPrices).map(address => ({
      address: address.toLowerCase(),
      price: allPrices[address]
    }));

    res.json({
      success: true,
      data: {
        chainId: parseInt(chainId),
        tokenCount: tokens.length,
        tokens: tokens,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('Error fetching available tokens:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Token addresses mapping
const TOKEN_ADDRESSES = {
  POLYGON: {
    // POL token (Polygon Ecosystem Token) - Correct mainnet address
    POL: '0x455e53908abea3c36d86123a5e5a54b4c8e70933', // This might not be in 1inch
    // Use WMATIC as POL alternative since they represent similar value
    WMATIC: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // Wrapped MATIC - should be available
    USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USD Coin - should be available
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // Tether USD
    WETH: '0x7ceb23fd6f88dd72b04ac0e5b7e2b8eac1b1b6e2', // Wrapped ETH
  },
  ETHEREUM: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xa0b86a33e6b6c38dd2b0d6e3e0e3c6cc3b1a8f1d',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  },
  APTOS: {
    APT: '0x1::aptos_coin::AptosCoin',
    USDC: 'aptos_usdc_address',
    USDT: 'aptos_usdt_address'
  }
};

/**
 * Get token prices from 1inch API
 * GET /api/prices?chainId=137&tokens=POL,MATIC
 */
app.get('/api/prices', async (req, res) => {
  try {
    const { chainId = '137', tokens = 'POL' } = req.query;
    
    // Handle Aptos chain with REAL PRICES! 🔥
    if (chainId === '99999') {
      console.log('🚀 Fetching REAL Aptos prices...');
      
      const aptosTokens = tokens.split(',');
      const realPrices = await fetchRealAptosPrices(aptosTokens);
      
      console.log('✅ Real Aptos prices fetched:', realPrices.map(p => `${p.symbol}: $${p.price}`));
      
      return res.json({
        success: true,
        data: realPrices,
        message: '🔥 Real Aptos prices from CoinGecko API',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate API key (only one needed for 1inch API)
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      console.warn('1inch API key not configured. Returning mock prices.');
      return res.json({
        success: false,
        error: 'API key not configured',
        data: getMockPrices(tokens.split(',')),
        timestamp: new Date().toISOString()
      });
    }

    // For now, let's get all prices from 1inch and filter what we need
    // Since the API returns prices for all whitelisted tokens
    const oneInchUrl = `https://api.1inch.dev/price/v1.1/${chainId}`;
    
    console.log(`Fetching all prices from: ${oneInchUrl}`);
    console.log(`Using API key: ${apiKey.substring(0, 10)}...`);
    
    const response = await fetch(oneInchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`1inch API error response: ${errorBody}`);
      throw new Error(`1inch API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const allPrices = await response.json();
    console.log('All prices received:', Object.keys(allPrices).length, 'tokens');
    
    // Debug: Show first 10 token addresses from API
    const addresses = Object.keys(allPrices).slice(0, 10);
    console.log('Sample token addresses from API:', addresses);
    
    // Map requested tokens to their prices
    const tokenList = tokens.split(',');
    const result = tokenList.map(symbol => {
      const tokenAddress = getTokenAddress(symbol.toUpperCase(), chainId);
      let price = tokenAddress ? allPrices[tokenAddress] || allPrices[tokenAddress.toLowerCase()] : null;
      
      // Convert from wei to decimal (1inch returns prices in wei format)
      if (price) {
        price = parseFloat(price) / Math.pow(10, 18);
      } else {
        price = 0;
      }
      
      // Ensure POL price matches WMATIC price
      if (symbol.toUpperCase() === 'POL') {
        const wmaticAddress = getTokenAddress('WMATIC', chainId);
        const wmaticPrice = wmaticAddress ? allPrices[wmaticAddress] || allPrices[wmaticAddress.toLowerCase()] : null;
        if (wmaticPrice) {
          price = parseFloat(wmaticPrice) / Math.pow(10, 18);
        }
      }
      
      console.log(`Mapping ${symbol}: address=${tokenAddress}, price=${price}`);
      
      return {
        symbol: symbol.toUpperCase(),
        address: tokenAddress || 'unknown',
        price: price,
        timestamp: Date.now(),
      };
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // Return mock prices as fallback
    const tokens = (req.query.tokens || 'POL').split(',');
    res.json({
      success: false,
      error: error.message,
      data: getMockPrices(tokens),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Helper function to get token address by symbol
 */
function getTokenAddress(symbol, chainId = '137') {
  switch (chainId.toString()) {
    case '137': // Polygon
      switch (symbol.toUpperCase()) {
        case 'POL':
          // POL not available in 1inch, use WMATIC as proxy since they're similar
          return TOKEN_ADDRESSES.POLYGON.WMATIC;
        case 'WMATIC':
          return TOKEN_ADDRESSES.POLYGON.WMATIC;
        case 'USDC':
          return TOKEN_ADDRESSES.POLYGON.USDC;
        case 'USDT':
          return TOKEN_ADDRESSES.POLYGON.USDT;
        case 'WETH':
          return TOKEN_ADDRESSES.POLYGON.WETH;
        default:
          return null;
      }
    case '1': // Ethereum
      switch (symbol.toUpperCase()) {
        case 'ETH':
          return TOKEN_ADDRESSES.ETHEREUM.ETH;
        case 'USDC':
          return TOKEN_ADDRESSES.ETHEREUM.USDC;
        case 'USDT':
          return TOKEN_ADDRESSES.ETHEREUM.USDT;
        default:
          return null;
      }
    case '99999': // Aptos
      switch (symbol.toUpperCase()) {
        case 'APT':
          return TOKEN_ADDRESSES.APTOS.APT;
        case 'USDC':
          return TOKEN_ADDRESSES.APTOS.USDC;
        case 'USDT':
          return TOKEN_ADDRESSES.APTOS.USDT;
        default:
          return null;
      }
    default:
      return null;
  }
}

/**
 * Get specific POL and APT exchange rate
 * GET /api/exchange-rate
 */
app.get('/api/exchange-rate', async (req, res) => {
  try {
    // For now, we'll fetch POL price and use mock APT price
    // since 1inch might not support Aptos chain directly
    
    const polResponse = await fetch(`http://localhost:${PORT}/api/prices?chainId=137&tokens=POL`);
    const polData = await polResponse.json();
    
    const polPrice = polData.data[0]?.price || 0.4024;
    const aptPrice = 4024.57; // Mock APT price - you might need to use another API for APT
    
    const exchangeRate = aptPrice / polPrice;
    
    res.json({
      success: true,
      data: {
        polPrice,
        aptPrice,
        exchangeRate: exchangeRate.toFixed(2),
        formattedRate: `1 POL = ${exchangeRate.toFixed(2)} APT ~$${aptPrice.toFixed(1)}`,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    res.json({
      success: false,
      error: error.message,
      data: {
        polPrice: 0.4024,
        aptPrice: 4024.57,
        exchangeRate: "4024.57",
        formattedRate: "1 POL = 4024.57 APT ~$4022.3",
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Mock prices for development/fallback
 */
function getMockPrices(tokens) {
  const mockPrices = {
    POL: 1.0,       // POL same price as MATIC
    MATIC: 1.0,
    WMATIC: 1.0,
    APT: 8.5,
    USDC: 1.0,
    USDT: 1.0,
    ETH: 2500,
    WETH: 2500,
  };

  return tokens.map(symbol => ({
    symbol: symbol.toUpperCase(),
    address: getTokenAddress(symbol.toUpperCase()) || 'mock',
    price: mockPrices[symbol.toUpperCase()] || 1.0,
    timestamp: Date.now(),
  }));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend proxy server running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`🔑 API Keys configured: ${process.env.ONEINCH_API_KEY ? '✅' : '❌'}`);
});