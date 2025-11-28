const User = require('../models/User');
const { pool } = require('../config/database');

class RecommendationService {
  constructor() {
    this.tableNames = null;
  }

  /**
   * Detect actual table names in database
   */
  async getTableNames() {
    if (this.tableNames) return this.tableNames;

    try {
      const [tables] = await pool.query('SHOW TABLES');
      const tableList = tables.map(t => Object.values(t)[0].toLowerCase());
      
      console.log('📋 Available tables:', tableList);

      // Find the actual table names (case-insensitive)
      this.tableNames = {
        transaction: tableList.find(t => t === 'transaction') || 'transaction',
        block: tableList.find(t => t === 'block') || 'block',
        flat_type: tableList.find(t => t.includes('flat') && t.includes('type')) || 'flattype',
        storey_range: tableList.find(t => t.includes('storey') || t.includes('range')) || 'storeyrange',
        town: tableList.find(t => t === 'town') || 'town',
        lease: tableList.find(t => t === 'lease') || 'lease'
      };

      console.log('✅ Detected table names:', this.tableNames);
      return this.tableNames;
    } catch (error) {
      console.error('❌ Error detecting tables:', error);
      // Fallback to common names
      return {
        transaction: 'transaction',
        block: 'block',
        flat_type: 'flattype',
        storey_range: 'storeyrange',
        town: 'town',
        lease: 'lease'
      };
    }
  }

  /**
   * Get personalized recommendations based on user behavior
   */
  async getRecommendations(userId, limit = 6) {
    try {
      console.log('🎯 Generating recommendations for user:', userId);

      const user = await User.findById(userId);
      
      if (!user) {
        console.log('⚠️ User not found, returning fallback');
        return this.getFallbackRecommendations(limit);
      }

      // Extract user preferences
      const preferences = this.extractPreferences(user);
      console.log('📊 Extracted preferences:', preferences);
      
      // Get recommendations from MySQL
      const recommendations = await this.fetchRecommendations(preferences, limit);
      
      return {
        success: true,
        recommendations,
        reasoning: this.generateReasoning(preferences),
        preferencesUsed: preferences
      };
      
    } catch (error) {
      console.error('❌ Recommendation error:', error);
      throw error;
    }
  }

  /**
   * Extract user preferences from MongoDB data
   */
  extractPreferences(user) {
    const preferences = {
      towns: [],
      viewedTransactionIds: [],
      hasHistory: false
    };

    // 1. Extract towns from search history (last 10 searches)
    if (user.searchHistory && user.searchHistory.length > 0) {
      preferences.hasHistory = true;
      
      const recentSearches = user.searchHistory.slice(-10);
      const townFrequency = {};
      
      recentSearches.forEach(search => {
        if (search.towns && Array.isArray(search.towns) && search.towns.length > 0) {
          search.towns.forEach(town => {
            townFrequency[town] = (townFrequency[town] || 0) + 1;
          });
        }
      });
      
      // Get top 3 most searched towns
      preferences.towns = Object.entries(townFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([town]) => town);

      console.log('📍 Preferred towns:', preferences.towns);
    }

    // 2. Extract viewed properties
    if (user.viewedProperties && user.viewedProperties.length > 0) {
      preferences.hasHistory = true;
      
      // Get most viewed properties
      preferences.viewedTransactionIds = user.viewedProperties
        .filter(v => v.viewCount >= 1)
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5)
        .map(v => v.transaction_id);

      console.log('👁️ Viewed properties:', preferences.viewedTransactionIds.length);
    }

    return preferences;
  }

  /**
   * Fetch recommendations from MySQL based on preferences
   */
  async fetchRecommendations(preferences, limit) {
    const { towns, viewedTransactionIds } = preferences;
    
    // Get actual table names
    const tables = await this.getTableNames();
    
    let query = `
      SELECT 
        t.transaction_id,
        b.block_number,
        b.street_name,
        ft.flat_type_name,
        t.floor_area_sqm,
        sr.range as storey_range,
        tn.town_name,
        t.month,
        t.price,
        ROUND(t.price / t.floor_area_sqm, 2) as price_per_sqm
      FROM ${tables.transaction} t
      JOIN ${tables.block} b ON t.block_id = b.block_id
      JOIN ${tables.flat_type} ft ON t.flat_type_id = ft.flat_type_id
      JOIN ${tables.storey_range} sr ON t.storey_id = sr.storey_id
      JOIN ${tables.town} tn ON b.town_id = tn.town_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by preferred towns if available
    if (towns.length > 0) {
      query += ` AND tn.town_name IN (${towns.map(() => '?').join(',')})`;
      params.push(...towns);
      console.log('🎯 Filtering by towns:', towns);
    }
    
    // Exclude already viewed properties
    if (viewedTransactionIds.length > 0) {
      query += ` AND t.transaction_id NOT IN (${viewedTransactionIds.map(() => '?').join(',')})`;
      params.push(...viewedTransactionIds);
      console.log('🚫 Excluding viewed:', viewedTransactionIds.length);
    }
    
    // Get recent transactions (last 12 months)
    query += ` AND t.month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 MONTH), '%Y-%m')`;
    
    // Order by recency and add variety
    query += ` ORDER BY t.month DESC, RAND() LIMIT ?`;
    params.push(limit);
    
    console.log('🔍 Executing MySQL query');
    
    try {
      const [rows] = await pool.query(query, params);
      console.log('✅ Found', rows.length, 'recommendations');
      return rows;
    } catch (error) {
      console.error('❌ MySQL query error:', error.message);
      console.error('Query was:', query);
      throw error;
    }
  }

  /**
   * Fallback recommendations for new users
   */
  async getFallbackRecommendations(limit) {
    console.log('🆕 Using fallback recommendations (new user)');
    
    // Get actual table names
    const tables = await this.getTableNames();
    
    const query = `
      SELECT 
        t.transaction_id,
        b.block_number,
        b.street_name,
        ft.flat_type_name,
        t.floor_area_sqm,
        sr.range as storey_range,
        tn.town_name,
        t.month,
        t.price,
        ROUND(t.price / t.floor_area_sqm, 2) as price_per_sqm
      FROM ${tables.transaction} t
      JOIN ${tables.block} b ON t.block_id = b.block_id
      JOIN ${tables.flat_type} ft ON t.flat_type_id = ft.flat_type_id
      JOIN ${tables.storey_range} sr ON t.storey_id = sr.storey_id
      JOIN ${tables.town} tn ON b.town_id = tn.town_id
      WHERE t.month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 MONTH), '%Y-%m')
      ORDER BY t.month DESC, RAND()
      LIMIT ?
    `;
    
    try {
      const [rows] = await pool.query(query, [limit]);
      
      return {
        success: true,
        recommendations: rows,
        reasoning: 'Popular recent properties',
        preferencesUsed: { hasHistory: false }
      };
    } catch (error) {
      console.error('❌ Fallback query error:', error.message);
      throw error;
    }
  }

  /**
   * Generate human-readable reasoning
   */
  generateReasoning(preferences) {
    if (!preferences.hasHistory) {
      return 'Popular recent properties';
    }
    
    const parts = [];
    
    if (preferences.towns.length > 0) {
      const townList = preferences.towns.slice(0, 2).join(' and ');
      parts.push(`properties in ${townList}`);
    }
    
    if (preferences.viewedTransactionIds.length > 0) {
      parts.push('similar to properties you viewed');
    }
    
    if (parts.length === 0) {
      return 'Recent market listings';
    }
    
    return `Based on your interest in ${parts.join(', ')}`;
  }
}

module.exports = new RecommendationService();