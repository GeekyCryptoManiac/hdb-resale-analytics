// src/services/apiTest.js
// This is just for testing - you can delete this file later

import * as api from './api';
import * as userService from './userService';

/**
 * Test all API endpoints
 * Run this from browser console: window.testAPI()
 */
export const testAllEndpoints = async () => {
  console.log('🧪 Testing API endpoints...\n');

  try {
    // Test MySQL endpoints
    console.log('1️⃣ Testing getTowns...');
    const towns = await api.getTowns();
    console.log('✅ Towns:', towns);

    console.log('\n2️⃣ Testing getFlatTypes...');
    const flatTypes = await api.getFlatTypes();
    console.log('✅ Flat Types:', flatTypes);

    console.log('\n3️⃣ Testing getRecentTransactions...');
    const recent = await api.getRecentTransactions(5);
    console.log('✅ Recent Transactions:', recent);

    console.log('\n4️⃣ Testing searchProperties...');
    const searchResults = await api.searchProperties({
      towns: ['BEDOK'],
      limit: 5
    });
    console.log('✅ Search Results:', searchResults);

    console.log('\n5️⃣ Testing getOverallStatistics...');
    const stats = await api.getOverallStatistics();
    console.log('✅ Statistics:', stats);

    console.log('\n✅ All MySQL API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error);
  }
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.testAPI = testAllEndpoints;
}

export default testAllEndpoints;