// src/services/userService.js
import axios from 'axios';

// Base URL for user/MongoDB endpoints
const USER_API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance for user service
const userApi = axios.create({
  baseURL: USER_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================
// USER/AUTH ENDPOINTS (MongoDB)
// ============================================

/**
 * Login or register user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.name - User name
 * @returns {Promise} User object
 */
export const loginUser = async (userData) => {
  const response = await userApi.post('/users/login', userData);
  return response.data;
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID (MongoDB ObjectId)
 * @returns {Promise} User object
 */
export const getUserProfile = async (userId) => {
  const response = await userApi.get(`/users/${userId}`);
  return response.data;
};

// ============================================
// COMPARISON LIST ENDPOINTS (MongoDB)
// ============================================

/**
 * Get user's comparison list
 * Returns array of full property details
 * @param {string} userId - User ID
 * @returns {Promise} Array of properties in comparison list
 */
export const getComparisonList = async (userId) => {
  const response = await userApi.get(`/users/${userId}/comparison`);
  return response.data;
};

/**
 * Add property to comparison list
 * @param {string} userId - User ID
 * @param {number} transactionId - Transaction ID to add
 * @returns {Promise} Updated user object
 */
export const addToComparison = async (userId, transactionId) => {
  const response = await userApi.post(`/users/${userId}/comparison`, {
    transactionId
  });
  return response.data;
};

/**
 * Remove property from comparison list
 * @param {string} userId - User ID
 * @param {number} transactionId - Transaction ID to remove
 * @returns {Promise} Updated user object
 */
export const removeFromComparison = async (userId, transactionId) => {
  const response = await userApi.delete(`/users/${userId}/comparison/${transactionId}`);
  return response.data;
};

/**
 * Clear entire comparison list
 * @param {string} userId - User ID
 * @returns {Promise} Updated user object
 */
export const clearComparison = async (userId) => {
  const response = await userApi.delete(`/users/${userId}/comparison`);
  return response.data;
};

/**
 * Check if property is in user's comparison list
 * @param {string} userId - User ID
 * @param {number} transactionId - Transaction ID to check
 * @returns {Promise<boolean>} True if in comparison list
 */
export const isInComparison = async (userId, transactionId) => {
  try {
    const response = await getComparisonList(userId);
    const comparisonList = response.data || response;
    
    // Check if transactionId exists in the comparison list
    return comparisonList.some(item => 
      item.transaction_id === transactionId || item.transactionId === transactionId
    );
  } catch (error) {
    console.error('Error checking comparison status:', error);
    return false;
  }
};

export default userApi;