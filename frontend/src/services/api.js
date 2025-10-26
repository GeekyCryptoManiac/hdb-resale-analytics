// src/services/api.js
import axios from 'axios';

// Base URL for backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor (for logging, auth tokens, etc.)
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed later
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor (for error handling)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================
// TOWN ENDPOINTS
// ============================================

/**
 * Get all towns
 * @returns {Promise} Array of towns
 */
export const getTowns = async () => {
  const response = await api.get('/towns');
  return response.data;
};

/**
 * Get all towns with statistics
 * @returns {Promise} Array of towns with transaction counts
 */
export const getTownsWithStats = async () => {
  const response = await api.get('/towns/stats');
  return response.data;
};

/**
 * Get single town by ID
 * @param {number} townId - Town ID
 * @returns {Promise} Town object
 */
export const getTownById = async (townId) => {
  const response = await api.get(`/towns/${townId}`);
  return response.data;
};

/**
 * Get town with detailed statistics
 * @param {number} townId - Town ID
 * @returns {Promise} Town with stats
 */
export const getTownWithStats = async (townId) => {
  const response = await api.get(`/towns/${townId}/stats`);
  return response.data;
};

// ============================================
// FLAT TYPE ENDPOINTS
// ============================================

/**
 * Get all flat types
 * @returns {Promise} Array of flat types
 */
export const getFlatTypes = async () => {
  const response = await api.get('/flat-types');
  return response.data;
};

/**
 * Get all flat types with statistics
 * @returns {Promise} Array of flat types with stats
 */
export const getFlatTypesWithStats = async () => {
  const response = await api.get('/flat-types/stats');
  return response.data;
};

/**
 * Get single flat type by ID
 * @param {number} flatTypeId - Flat Type ID
 * @returns {Promise} Flat type object
 */
export const getFlatTypeById = async (flatTypeId) => {
  const response = await api.get(`/flat-types/${flatTypeId}`);
  return response.data;
};

// ============================================
// PROPERTY/TRANSACTION ENDPOINTS
// ============================================

/**
 * Search properties with filters
 * @param {Object} filters - Search filters
 * @param {Array|string} filters.towns - Array or single town name
 * @param {Array|string} filters.flatTypes - Array or single flat type name
 * @param {number} filters.minPrice
 * @param {number} filters.maxPrice
 * @param {number} filters.minFloorArea
 * @param {number} filters.maxFloorArea
 * @param {number} filters.minRemainingLease
 * @param {string} filters.sortBy
 * @param {string} filters.sortOrder
 * @param {number} filters.limit
 * @param {number} filters.page
 * @returns {Promise} Object with properties array
 */
export const searchProperties = async (filters = {}, fetchAll = false) => {
  const params = new URLSearchParams();

  const towns = Array.isArray(filters.towns)
    ? filters.towns
    : filters.towns
    ? [filters.towns]
    : [];
  if (towns.length > 0) params.append('towns', towns.join(','));

  const flatTypes = Array.isArray(filters.flatTypes)
    ? filters.flatTypes
    : filters.flatTypes
    ? [filters.flatTypes]
    : [];
  if (flatTypes.length > 0) params.append('flatTypes', flatTypes.join(','));

  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  if (filters.minFloorArea) params.append('minFloorArea', filters.minFloorArea);
  if (filters.maxFloorArea) params.append('maxFloorArea', filters.maxFloorArea);
  if (filters.minRemainingLease) params.append('minRemainingLease', filters.minRemainingLease);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  if (!fetchAll) {
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.page) params.append('page', filters.page);
  } else {
    // Some backends support a very large limit, e.g., 100000 to fetch everything
    params.append('limit', 100000);
    params.append('page', 1);
  }

  const response = await api.get(`/properties/search?${params.toString()}`);
  return response.data;
};



/**
 * Get property by transaction ID
 * @param {number} transactionId - Transaction ID
 * @returns {Promise} Property object with full details
 */
export const getPropertyById = async (transactionId) => {
  const response = await api.get(`/properties/${transactionId}`);
  return response.data;
};

/**
 * Get recent transactions
 * @param {number} limit - Number of transactions to retrieve
 * @returns {Promise} Array of recent transactions
 */
export const getRecentTransactions = async (limit = 20) => {
  const response = await api.get(`/properties/recent?limit=${limit}`);
  return response.data;
};

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * Get overall market statistics
 * @returns {Promise} Overall statistics object
 */
export const getOverallStatistics = async () => {
  const response = await api.get('/analytics/statistics');
  return response.data;
};

/**
 * Get price trends over time
 * @param {Object} options - Options object
 * @param {number} options.months - Number of months to retrieve
 * @param {string} options.town - Filter by town name
 * @param {string} options.flatType - Filter by flat type name
 * @returns {Promise} Array of price trends by month
 */
export const getPriceTrends = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.months) params.append('months', options.months);
  if (options.town) params.append('town', options.town);
  if (options.flatType) params.append('flatType', options.flatType);
  
  const response = await api.get(`/analytics/price-trends?${params.toString()}`);
  return response.data;
};

/**
 * Get town comparison data
 * @returns {Promise} Array of towns with comparison metrics
 */
export const getTownComparison = async () => {
  const response = await api.get('/analytics/town-comparison');
  return response.data;
};

/**
 * Get flat type comparison data
 * @returns {Promise} Array of flat types with comparison metrics
 */
export const getFlatTypeComparison = async () => {
  const response = await api.get('/analytics/flat-type-comparison');
  return response.data;
};

/**
 * Get price distribution
 * @param {number} bucketSize - Price bucket size (default: 50000)
 * @returns {Promise} Array of price buckets with counts
 */
export const getPriceDistribution = async (bucketSize = 50000) => {
  const response = await api.get(`/analytics/price-distribution?bucketSize=${bucketSize}`);
  return response.data;
};

// Export api instance for custom requests
export default api;