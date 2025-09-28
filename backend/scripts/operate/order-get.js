#!/usr/bin/env node

/**
 * Order Get Script
 * Retrieves order details via the /api/v1/order/:orderId endpoint
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
    console.log('Usage: node order-get.js <orderId>');
    console.log('Example: node order-get.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }
  
  return args[0];
}

async function getOrder(orderId) {
  try {
    console.log('🔍 Retrieving order details...');
    console.log(`📍 Endpoint: ${BASE_URL}/api/v1/order/${orderId}`);
    console.log(`🆔 Order ID: ${orderId}`);
    
    const response = await axios.get(`${BASE_URL}/api/v1/order/${orderId}`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order retrieved successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.order) {
      const order = response.data.order;
      console.log('\n📋 Order Details:');
      console.log(`  🆔 ID: ${order.id || 'N/A'}`);
      console.log(`  📊 Status: ${order.status || 'N/A'}`);
      console.log(`  👤 Maker: ${order.makerAddress || 'N/A'}`);
      console.log(`  👤 Taker: ${order.takerAddress || 'N/A'}`);
      console.log(`  🔗 From Chain: ${order.fromChain || 'N/A'}`);
      console.log(`  🔗 To Chain: ${order.toChain || 'N/A'}`);
      console.log(`  🪙 From Token: ${order.fromToken || 'N/A'}`);
      console.log(`  🪙 To Token: ${order.toToken || 'N/A'}`);
      console.log(`  💰 Amount: ${order.amount || 'N/A'}`);
      console.log(`  ⏰ Timelock: ${order.timelock || 'N/A'}`);
      
      if (order.transactionHash) {
        console.log(`  🔗 Transaction Hash: ${order.transactionHash}`);
      }
      if (order.blockNumber) {
        console.log(`  📦 Block Number: ${order.blockNumber}`);
      }
      if (order.createdAt) {
        console.log(`  📅 Created: ${new Date(order.createdAt).toLocaleString()}`);
      }
      if (order.updatedAt) {
        console.log(`  📅 Updated: ${new Date(order.updatedAt).toLocaleString()}`);
      }
    }

    return response.data;
  } catch (error) {
    console.error('❌ Order retrieval failed!');
    
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

// Run the order retrieval
if (import.meta.url === `file://${process.argv[1]}`) {
  const orderId = getOrderIdFromArgs();
  
  getOrder(orderId)
    .then(result => {
      if (result && result.success) {
        console.log('\n🎉 Order retrieved successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Failed to retrieve order');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { getOrder };