#!/usr/bin/env node

/**
 * Health Check Script
 * Tests the /health endpoint of the 1inch-apt-bridge backend
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function checkHealth() {
  try {
    console.log('🔍 Checking backend health...');
    console.log(`📍 Endpoint: ${BASE_URL}/health`);
    
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Health check successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    // Check specific services
    const { services } = response.data;
    if (services) {
      console.log('\n🔧 Service Status:');
      Object.entries(services).forEach(([service, status]) => {
        const icon = status === 'connected' || status === 'running' ? '✅' : '❌';
        console.log(`  ${icon} ${service}: ${status}`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Health check failed!');
    
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

// Run the health check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkHealth()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { checkHealth };