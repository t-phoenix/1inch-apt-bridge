#!/usr/bin/env node

/**
 * Swap Status Script
 * Checks the status of a swap order via the /api/v1/swap/status/:orderId endpoint
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getOrderIdFromArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Error: Order ID is required');
    console.log('Usage: node swap-status.js <orderId>');
    console.log('Example: node swap-status.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }
  
  return args[0];
}

async function checkSwapStatus(orderId) {
  try {
    console.log('🔍 Checking swap status...');
    console.log(`📍 Endpoint: ${BASE_URL}/api/v1/swap/status/${orderId}`);
    console.log(`🆔 Order ID: ${orderId}`);
    
    const response = await axios.get(`${BASE_URL}/api/v1/swap/status/${orderId}`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Status check successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.status) {
      const status = response.data.status;
      console.log(`\n📈 Swap Status: ${status}`);
      
      // Display status-specific information
      switch (status.toLowerCase()) {
        case 'pending':
          console.log('⏳ The swap is waiting to be processed');
          break;
        case 'processing':
          console.log('🔄 The swap is currently being processed');
          break;
        case 'completed':
          console.log('✅ The swap has been completed successfully');
          break;
        case 'failed':
          console.log('❌ The swap has failed');
          break;
        case 'cancelled':
          console.log('🚫 The swap has been cancelled');
          break;
        default:
          console.log('ℹ️  Unknown status');
      }
    }

    return response.data;
  } catch (error) {
    console.error('❌ Status check failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response:`, error.response.data);
      
      if (error.response.status === 404) {
        console.log('\n💡 The order might not exist or the order ID might be incorrect');
      }
    } else if (error.request) {
      console.error('No response received. Is the backend running?');
      console.error('Make sure to start the backend with: npm run dev');
    } else {
      console.error('Error:', error.message);
    }
    
    return null;
  }
}

// Run the status check
if (import.meta.url === `file://${process.argv[1]}`) {
  const orderId = getOrderIdFromArgs();
  
  checkSwapStatus(orderId)
    .then(result => {
      if (result && result.success) {
        console.log('\n🎉 Status check completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Failed to check swap status');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { checkSwapStatus };