#!/usr/bin/env node

/**
 * Root Endpoint Script
 * Tests the root endpoint (/) of the 1inch-apt-bridge backend
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function checkRootEndpoint() {
  try {
    console.log('🏠 Checking root endpoint...');
    console.log(`📍 Endpoint: ${BASE_URL}/`);
    
    const response = await axios.get(`${BASE_URL}/`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Root endpoint accessible!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    // Display API information
    const { message, version, status } = response.data;
    if (message && version && status) {
      console.log('\n📋 API Information:');
      console.log(`  📝 Name: ${message}`);
      console.log(`  🔢 Version: ${version}`);
      console.log(`  🟢 Status: ${status}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Root endpoint check failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response:`, error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend running?');
      console.error('Make sure to start the backend with: npm run dev');
    } else {
      console.error('Error:', error.message);
    }
    
    return false;
  }
}

// Run the root endpoint check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkRootEndpoint()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { checkRootEndpoint };