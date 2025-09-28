#!/usr/bin/env node

/**
 * Order Update Script
 * Updates order status via the /api/v1/order/:orderId/status endpoint
 * This is typically used by the relayer service internally
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Error: Order ID and status are required');
    console.log('Usage: node order-update.js <orderId> <status> [transactionHash] [blockNumber]');
    console.log('Example: node order-update.js 123e4567-e89b-12d3-a456-426614174000 completed 0xabc123... 12345');
    console.log('\nValid statuses: pending, processing, completed, failed, cancelled');
    process.exit(1);
  }
  
  const orderId = args[0];
  const status = args[1];
  const transactionHash = args[2] || null;
  const blockNumber = args[3] ? parseInt(args[3], 10) : null;
  
  // Validate status
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
  if (!validStatuses.includes(status.toLowerCase())) {
    console.error(`❌ Error: Invalid status '${status}'`);
    console.log(`Valid statuses: ${validStatuses.join(', ')}`);
    process.exit(1);
  }
  
  return {
    orderId,
    status: status.toLowerCase(),
    transactionHash,
    blockNumber
  };
}

async function updateOrderStatus({ orderId, status, transactionHash, blockNumber }) {
  try {
    console.log('🔄 Updating order status...');
    console.log(`📍 Endpoint: ${BASE_URL}/api/v1/order/${orderId}/status`);
    console.log(`🆔 Order ID: ${orderId}`);
    console.log(`📊 New Status: ${status}`);
    
    const updateData = {
      status,
      ...(transactionHash && { transactionHash }),
      ...(blockNumber && { blockNumber })
    };
    
    console.log('📋 Update Data:', JSON.stringify(updateData, null, 2));
    
    const response = await axios.patch(`${BASE_URL}/api/v1/order/${orderId}/status`, updateData, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order status updated successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.order) {
      const order = response.data.order;
      console.log('\n📋 Updated Order Details:');
      console.log(`  🆔 ID: ${order.id || 'N/A'}`);
      console.log(`  📊 Status: ${order.status || 'N/A'}`);
      
      if (order.transactionHash) {
        console.log(`  🔗 Transaction Hash: ${order.transactionHash}`);
      }
      if (order.blockNumber) {
        console.log(`  📦 Block Number: ${order.blockNumber}`);
      }
      if (order.updatedAt) {
        console.log(`  📅 Updated: ${new Date(order.updatedAt).toLocaleString()}`);
      }
    }

    return response.data;
  } catch (error) {
    console.error('❌ Order update failed!');
    
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

// Run the order update
if (import.meta.url === `file://${process.argv[1]}`) {
  const updateParams = parseCommandLineArgs();
  
  updateOrderStatus(updateParams)
    .then(result => {
      if (result && result.success) {
        console.log('\n🎉 Order status updated successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Failed to update order status');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { updateOrderStatus };