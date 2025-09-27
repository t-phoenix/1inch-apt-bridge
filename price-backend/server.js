import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
    
    // Handle Aptos chain separately since it's not supported by 1inch
    if (chainId === '99999') {
      const aptosTokens = tokens.split(',');
      const aptosResult = aptosTokens.map(symbol => {
        let price = 1.0;
        switch (symbol.toUpperCase()) {
          case 'APT':
            price = 8.5;
            break;
          case 'USDC':
          case 'USDT':
            price = 1.0;
            break;
        }
        
        return {
          symbol: symbol.toUpperCase(),
          address: TOKEN_ADDRESSES.APTOS[symbol.toUpperCase()] || 'aptos_mock',
          price: price,
          timestamp: Date.now(),
        };
      });

      return res.json({
        success: true,
        data: aptosResult,
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