#!/usr/bin/env node

/**
 * Backend Operation Scripts Index
 * Demonstrates how to use all the backend operation scripts
 */

import { checkHealth } from './health-check.js';
import { checkRootEndpoint } from './root-endpoint.js';
import { createSwap } from './swap-create.js';
import { checkSwapStatus } from './swap-status.js';
import { getOrder } from './order-get.js';
import { updateOrderStatus } from './order-update.js';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function demonstrateAllScripts() {
  console.log('🚀 1inch-apt-bridge Backend Operation Scripts Demo');
  console.log('=' .repeat(50));
  console.log(`📍 Backend URL: ${BASE_URL}`);
  console.log('');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResult = await checkHealth();
    console.log('');

    // 2. Root Endpoint
    console.log('2️⃣ Testing Root Endpoint...');
    const rootResult = await checkRootEndpoint();
    console.log('');

    // 3. Create Swap (with demo parameters)
    console.log('3️⃣ Creating Demo Swap Order...');
    const swapParams = {
      makerAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      takerAddress: '0x8ba1f109551bD432803012645Hac136c',
      fromChain: 'ethereum',
      toChain: 'aptos',
      fromToken: '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C4',
      toToken: '0x1::aptos_coin::AptosCoin',
      amount: 1000000000000000000, // 1 ETH
      timelock: 3600 // 1 hour
    };
    
    const swapResult = await createSwap(swapParams);
    console.log('');

    // 4. Check Swap Status (if swap was created successfully)
    if (swapResult && swapResult.success && swapResult.orderId) {
      console.log('4️⃣ Checking Swap Status...');
      await checkSwapStatus(swapResult.orderId);
      console.log('');

      // 5. Get Order Details
      console.log('5️⃣ Getting Order Details...');
      await getOrder(swapResult.orderId);
      console.log('');

      // 6. Update Order Status (demo)
      console.log('6️⃣ Updating Order Status (Demo)...');
      await updateOrderStatus({
        orderId: swapResult.orderId,
        status: 'processing',
        transactionHash: '0xdemo123456789abcdef...',
        blockNumber: 12345
      });
      console.log('');
    } else {
      console.log('⚠️  Skipping status checks - swap creation failed');
      console.log('');
    }

    console.log('✅ Demo completed successfully!');
    console.log('');
    console.log('💡 You can run individual scripts:');
    console.log('   node health-check.js');
    console.log('   node root-endpoint.js');
    console.log('   node swap-create.js');
    console.log('   node swap-status.js <orderId>');
    console.log('   node order-get.js <orderId>');
    console.log('   node order-update.js <orderId> <status>');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demonstration
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateAllScripts()
    .then(() => {
      console.log('🎉 All scripts demonstrated successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateAllScripts };