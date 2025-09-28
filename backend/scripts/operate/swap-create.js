#!/usr/bin/env node

/**
 * Swap Create Script
 * Creates a new cross-chain swap order via the /api/v1/swap/create endpoint
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Default swap parameters - can be overridden via command line args or environment variables
const DEFAULT_SWAP_PARAMS = {
  makerAddress: process.env.MAKER_ADDRESS || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  takerAddress: process.env.TAKER_ADDRESS || '0x8ba1f109551bD432803012645Hac136c',
  fromChain: process.env.FROM_CHAIN || 'ethereum',
  toChain: process.env.TO_CHAIN || 'aptos',
  fromToken: process.env.FROM_TOKEN || '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C4',
  toToken: process.env.TO_TOKEN || '0x1::aptos_coin::AptosCoin',
  amount: process.env.AMOUNT || '1000000000000000000', // 1 ETH in wei
  timelock: process.env.TIMELOCK || 3600 // 1 hour in seconds
};

function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const params = { ...DEFAULT_SWAP_PARAMS };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      // Convert numeric values
      if (key === 'amount' || key === 'timelock') {
        params[key] = parseInt(value, 10);
      } else {
        params[key] = value;
      }
    }
  }
  
  return params;
}

async function createSwap(swapParams) {
  try {
    console.log('🔄 Creating cross-chain swap order...');
    console.log(`📍 Endpoint: ${BASE_URL}/api/v1/swap/create`);
    console.log('📋 Swap Parameters:');
    console.log(JSON.stringify(swapParams, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/v1/swap/create`, swapParams, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Swap order created successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.orderId) {
      console.log(`\n🎯 Order ID: ${response.data.orderId}`);
      console.log('💡 You can check the status with: node swap-status.js <orderId>');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Swap creation failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response:`, error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend running?');
      console.error('Make sure to start the backend with: npm run dev');
    } else {
      console.error('Error:', error.message);
    }
    
    return null;
  }
}

// Run the swap creation
if (import.meta.url === `file://${process.argv[1]}`) {
  const swapParams = parseCommandLineArgs();
  
  createSwap(swapParams)
    .then(result => {
      if (result && result.success) {
        console.log('\n🎉 Swap order created successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Failed to create swap order');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { createSwap };