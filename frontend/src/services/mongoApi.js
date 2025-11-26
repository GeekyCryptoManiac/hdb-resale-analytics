// src/services/mongoApi.js
import axios from 'axios';

// Base URL for MongoDB/NoSQL endpoints
const MONGO_API_BASE_URL = process.env.REACT_APP_MONGO_API_URL || 'http://localhost:3001/api/users';

/**
 * Track when a user views a property
 * This is called from PropertyDetailPage to log user behavior in MongoDB
 * 
 * @param {string} userId - The user's MongoDB _id
 * @param {object} propertyData - Property information to track
 * @param {string} propertyData.transaction_id - The property transaction ID
 * @param {string} propertyData.timestamp - ISO timestamp of the view
 * @returns {Promise} - Resolves when tracking is successful
 */
export const trackPropertyView = async (userId, propertyData) => {
  try {
    const response = await axios.post(
      `${MONGO_API_BASE_URL}/${userId}/track-view`,
      propertyData
    );
    return response.data;
  } catch (error) {
    // Don't throw error - tracking should fail silently
    console.error('Error tracking property view:', error);
    return null;
  }
};

/**
 * Track a search query
 * Stores user search patterns in MongoDB for analytics
 * 
 * @param {string} userId - The user's MongoDB _id
 * @param {object} searchData - Search query information
 * @returns {Promise}
 */
export const trackSearch = async (userId, searchData) => {
  try {
    const response = await axios.post(
      `${MONGO_API_BASE_URL}/${userId}/track-search`,
      {
        ...searchData,
        timestamp: new Date().toISOString()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error tracking search:', error);
    return null;
  }
};

/**
 * Get user's search history
 * 
 * @param {string} userId - The user's MongoDB _id
 * @returns {Promise<Array>} - Array of search history items
 */
export const getUserSearchHistory = async (userId) => {
  try {
    const response = await axios.get(
      `${MONGO_API_BASE_URL}/${userId}/search-history`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }
};

/**
 * Get user's viewed properties
 * 
 * @param {string} userId - The user's MongoDB _id
 * @returns {Promise<Array>} - Array of viewed properties
 */
export const getUserViewedProperties = async (userId) => {
  try {
    const response = await axios.get(
      `${MONGO_API_BASE_URL}/${userId}/viewed-properties`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching viewed properties:', error);
    throw error;
  }
};

/**
 * Save a property to user's favorites
 * 
 * @param {string} userId - The user's MongoDB _id
 * @param {string} transactionId - The property transaction ID
 * @returns {Promise}
 */
export const saveToFavorites = async (userId, transactionId) => {
  try {
    const response = await axios.post(
      `${MONGO_API_BASE_URL}/${userId}/favorites`,
      { transaction_id: transactionId }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving to favorites:', error);
    throw error;
  }
};

/**
 * Remove a property from user's favorites
 * 
 * @param {string} userId - The user's MongoDB _id
 * @param {string} transactionId - The property transaction ID
 * @returns {Promise}
 */
export const removeFromFavorites = async (userId, transactionId) => {
  try {
    const response = await axios.delete(
      `${MONGO_API_BASE_URL}/${userId}/favorites/${transactionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Get user's favorite properties
 * 
 * @param {string} userId - The user's MongoDB _id
 * @returns {Promise<Array>} - Array of favorite property IDs
 */
export const getUserFavorites = async (userId) => {
  try {
    const response = await axios.get(
      `${MONGO_API_BASE_URL}/${userId}/favorites`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

/**
 * Update user preferences
 * 
 * @param {string} userId - The user's MongoDB _id
 * @param {object} preferences - User preferences object
 * @returns {Promise}
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const response = await axios.put(
      `${MONGO_API_BASE_URL}/${userId}/preferences`,
      preferences
    );
    return response.data;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

export default {
  trackPropertyView,
  trackSearch,
  getUserSearchHistory,
  getUserViewedProperties,
  saveToFavorites,
  removeFromFavorites,
  getUserFavorites,
  updateUserPreferences,
};