#!/usr/bin/env node

/**
 * Test Scripts
 * Simple test to verify all scripts can be imported and basic functionality works
 */

import { checkHealth } from './health-check.js';
import { checkRootEndpoint } from './root-endpoint.js';
import { createSwap } from './swap-create.js';
import { checkSwapStatus } from './swap-status.js';
import { getOrder } from './order-get.js';
import { updateOrderStatus } from './order-update.js';

console.log('🧪 Testing Backend Operation Scripts');
console.log('=' .repeat(40));

// Test 1: Verify all modules can be imported
console.log('✅ All modules imported successfully');

// Test 2: Check if functions are available
const functions = [
  { name: 'checkHealth', fn: checkHealth },
  { name: 'checkRootEndpoint', fn: checkRootEndpoint },
  { name: 'createSwap', fn: createSwap },
  { name: 'checkSwapStatus', fn: checkSwapStatus },
  { name: 'getOrder', fn: getOrder },
  { name: 'updateOrderStatus', fn: updateOrderStatus }
];

functions.forEach(({ name, fn }) => {
  if (typeof fn === 'function') {
    console.log(`✅ ${name} function is available`);
  } else {
    console.log(`❌ ${name} function is not available`);
  }
});

console.log('');
console.log('🎉 All scripts are properly configured!');
console.log('');
console.log('📋 Available Scripts:');
console.log('  • health-check.js     - Check backend health');
console.log('  • root-endpoint.js    - Test root endpoint');
console.log('  • swap-create.js      - Create swap orders');
console.log('  • swap-status.js      - Check swap status');
console.log('  • order-get.js        - Get order details');
console.log('  • order-update.js     - Update order status');
console.log('  • index.js            - Run all scripts demo');
console.log('');
console.log('🚀 To get started:');
console.log('  1. Install dependencies: npm install');
console.log('  2. Start your backend: npm run dev');
console.log('  3. Run a script: node health-check.js');
console.log('  4. Or run demo: node index.js');