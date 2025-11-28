// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ============================================
// COMPARISON LIST ENDPOINTS
// ============================================

/**
 * GET /api/users/:userId/comparison
 * Get user's comparison list
 */
router.get('/:userId/comparison', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📥 GET comparison list for user:', userId);
    
    const user = await User.findById(userId).select('comparisonList');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Comparison list retrieved:', user.comparisonList?.length || 0, 'items');
    res.json(user.comparisonList || []);
  } catch (error) {
    console.error('❌ Error fetching comparison list:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comparison list',
      details: error.message 
    });
  }
});

/**
 * POST /api/users/:userId/comparison
 * Add property to comparison list
 */
router.post('/:userId/comparison', async (req, res) => {
  try {
    const { userId } = req.params;
    const { property } = req.body;

    console.log('📥 POST add to comparison for user:', userId);
    console.log('📦 Property data received:', JSON.stringify(property, null, 2));

    if (!property) {
      console.log('❌ No property data provided');
      return res.status(400).json({ error: 'Property data is required' });
    }

    if (!property.transaction_id) {
      console.log('❌ Property missing transaction_id');
      return res.status(400).json({ error: 'Property must have transaction_id' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.comparisonList) {
      user.comparisonList = [];
    }

    console.log('📋 Current comparison list BEFORE:', user.comparisonList.length, 'items');

    const alreadyExists = user.comparisonList.some(
      item => item.transaction_id == property.transaction_id
    );

    if (alreadyExists) {
      console.log('⚠️ Property already in comparison list');
      return res.status(400).json({ error: 'Property already in comparison list' });
    }

    if (user.comparisonList.length >= 3) {
      console.log('⚠️ Comparison list full (max 3)');
      return res.status(400).json({ 
        error: 'Maximum 3 properties allowed in comparison list' 
      });
    }

    const sanitizedProperty = {
      transaction_id: Number(property.transaction_id),
      block_number: property.block_number,
      street_name: property.street_name,
      flat_type_name: property.flat_type_name,
      floor_area_sqm: Number(property.floor_area_sqm) || 0,
      storey_range: property.storey_range,
      town_name: property.town_name || property.town,
      town: property.town || property.town_name,
      month: property.month,
      price: Number(property.price) || 0,
      price_per_sqm: Number(property.price_per_sqm) || 0
    };

    console.log('✨ Sanitized property:', sanitizedProperty);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          comparisonList: sanitizedProperty 
        } 
      },
      { 
        new: true,
        runValidators: true
      }
    );

    console.log('💾 User updated with $push operator');
    console.log('🔍 Verification - comparison list size:', updatedUser.comparisonList?.length || 0);

    const verifiedUser = await User.findById(userId).select('comparisonList');
    console.log('🔍 Fresh query verification:', verifiedUser.comparisonList?.length || 0);

    res.json({
      message: 'Property added to comparison',
      comparisonList: updatedUser.comparisonList || [],
      count: updatedUser.comparisonList?.length || 0
    });

  } catch (error) {
    console.error('❌ Error adding to comparison:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to add property to comparison',
      details: error.message
    });
  }
});

/**
 * DELETE /api/users/:userId/comparison/:transactionId
 * Remove property from comparison list
 */
router.delete('/:userId/comparison/:transactionId', async (req, res) => {
  try {
    const { userId, transactionId } = req.params;
    console.log('📥 DELETE from comparison - User:', userId, 'Transaction:', transactionId);

    const numericTransactionId = Number(transactionId);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $pull: { 
          comparisonList: { 
            transaction_id: numericTransactionId 
          } 
        } 
      },
      { 
        new: true,
        runValidators: false
      }
    );

    if (!updatedUser) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('💾 Property removed using $pull operator');
    console.log('🔍 New comparison list size:', updatedUser.comparisonList?.length || 0);

    res.json({
      message: 'Property removed from comparison',
      comparisonList: updatedUser.comparisonList || [],
      count: updatedUser.comparisonList?.length || 0
    });

  } catch (error) {
    console.error('❌ Error removing from comparison:', error);
    res.status(500).json({ 
      error: 'Failed to remove property from comparison',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/users/:userId/comparison
 * Clear entire comparison list
 */
router.delete('/:userId/comparison', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📥 DELETE all comparisons for user:', userId);

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    user.comparisonList = [];
    await user.save({ validateBeforeSave: false });
    console.log('✅ Comparison list cleared');

    res.json({
      message: 'Comparison list cleared',
      comparisonList: []
    });
  } catch (error) {
    console.error('❌ Error clearing comparison list:', error);
    res.status(500).json({ 
      error: 'Failed to clear comparison list',
      details: error.message 
    });
  }
});

// ============================================
// 🆕 PROPERTY VIEW TRACKING ENDPOINTS
// ============================================

/**
 * POST /api/users/:userId/track-view
 * Track when user views a property
 */
router.post('/:userId/track-view', async (req, res) => {
  try {
    const { userId } = req.params;
    const { transaction_id, timestamp } = req.body;

    console.log('👁️ Track property view - User:', userId, 'Property:', transaction_id);

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: 'transaction_id is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize viewedProperties if it doesn't exist
    if (!user.viewedProperties) {
      user.viewedProperties = [];
    }

    // Check if property already viewed
    const existingView = user.viewedProperties.find(
      view => view.transaction_id === parseInt(transaction_id)
    );

    if (existingView) {
      // Increment view count and update timestamp
      existingView.viewCount += 1;
      existingView.timestamp = new Date(timestamp || Date.now());
      console.log('📈 Incremented view count to:', existingView.viewCount);
    } else {
      // Add new view
      user.viewedProperties.push({
        transaction_id: parseInt(transaction_id),
        timestamp: new Date(timestamp || Date.now()),
        viewCount: 1
      });
      console.log('✨ New property view tracked');
    }

    // Keep only last 100 viewed properties
    if (user.viewedProperties.length > 100) {
      user.viewedProperties = user.viewedProperties
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Property view tracked',
      data: {
        transaction_id,
        viewCount: existingView ? existingView.viewCount : 1
      }
    });

  } catch (error) {
    console.error('❌ Error tracking property view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track property view',
      details: error.message
    });
  }
});

/**
 * GET /api/users/:userId/viewed-properties
 * Get user's viewed properties history
 */
router.get('/:userId/viewed-properties', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    console.log('📋 GET viewed properties for user:', userId);

    const user = await User.findById(userId).select('viewedProperties');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const viewedProperties = (user.viewedProperties || [])
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    console.log('✅ Retrieved', viewedProperties.length, 'viewed properties');

    res.json({
      success: true,
      data: viewedProperties
    });

  } catch (error) {
    console.error('❌ Error fetching viewed properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch viewed properties',
      details: error.message
    });
  }
});

// ============================================
// 🆕 SEARCH TRACKING ENDPOINTS
// ============================================

/**
 * POST /api/users/:userId/track-search
 * Track user search queries
 */
router.post('/:userId/track-search', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      timestamp, 
      resultsCount, 
      towns,
      flat_type,
      min_price,
      max_price,
      floor_area_min,
      floor_area_max,
      min_remaining_lease,
      sort_by,
      sort_order
    } = req.body;

    console.log('🔍 Track search - User:', userId);
    console.log('📦 Received data:', req.body); // Debug log

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize searchHistory if it doesn't exist
    if (!user.searchHistory) {
      user.searchHistory = [];
    }

    // ✅ CORRECT: Save individual fields at top level
    user.searchHistory.push({
      towns: towns || [],
      flat_type: flat_type || null,
      min_price: min_price ? Number(min_price) : null,
      max_price: max_price ? Number(max_price) : null,
      floor_area_min: floor_area_min ? Number(floor_area_min) : null,
      floor_area_max: floor_area_max ? Number(floor_area_max) : null,
      min_remaining_lease: min_remaining_lease ? Number(min_remaining_lease) : null,
      sort_by: sort_by || null,
      sort_order: sort_order || null,
      timestamp: new Date(timestamp || Date.now()),
      resultsCount: resultsCount || null
    });

    console.log('📝 Search history entry:', user.searchHistory[user.searchHistory.length - 1]);

    // Keep only last 50 searches
    if (user.searchHistory.length > 50) {
      user.searchHistory = user.searchHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
    }

    await user.save();

    console.log('✅ Search tracked, total searches:', user.searchHistory.length);

    res.json({
      success: true,
      message: 'Search tracked'
    });

  } catch (error) {
    console.error('❌ Error tracking search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track search',
      details: error.message
    });
  }
});

/**
 * GET /api/users/:userId/search-history
 * Get user's search history
 */
router.get('/:userId/search-history', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    console.log('📋 GET search history for user:', userId);

    const user = await User.findById(userId).select('searchHistory');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const searchHistory = (user.searchHistory || [])
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    console.log('✅ Retrieved', searchHistory.length, 'searches');

    res.json({
      success: true,
      data: searchHistory
    });

  } catch (error) {
    console.error('❌ Error fetching search history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search history',
      details: error.message
    });
  }
});

// ============================================
// 🆕 FAVORITES ENDPOINTS
// ============================================

/**
 * POST /api/users/:userId/favorites
 * Add property to favorites
 */
router.post('/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;
    const { transaction_id } = req.body;

    console.log('⭐ Add to favorites - User:', userId, 'Property:', transaction_id);

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: 'transaction_id is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize favorites if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    // Check if already in favorites
    const alreadyFavorited = user.favorites.some(
      fav => fav.transaction_id === parseInt(transaction_id)
    );

    if (alreadyFavorited) {
      return res.status(400).json({
        success: false,
        error: 'Property already in favorites'
      });
    }

    user.favorites.push({
      transaction_id: parseInt(transaction_id),
      addedAt: new Date()
    });

    await user.save();

    console.log('✅ Added to favorites, total:', user.favorites.length);

    res.json({
      success: true,
      message: 'Added to favorites',
      data: { transaction_id }
    });

  } catch (error) {
    console.error('❌ Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to favorites',
      details: error.message
    });
  }
});

/**
 * DELETE /api/users/:userId/favorites/:transactionId
 * Remove property from favorites
 */
router.delete('/:userId/favorites/:transactionId', async (req, res) => {
  try {
    const { userId, transactionId } = req.params;

    console.log('💔 Remove from favorites - User:', userId, 'Property:', transactionId);

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    user.favorites = user.favorites.filter(
      fav => fav.transaction_id !== parseInt(transactionId)
    );

    await user.save();

    console.log('✅ Removed from favorites');

    res.json({
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('❌ Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from favorites',
      details: error.message
    });
  }
});

/**
 * GET /api/users/:userId/favorites
 * Get user's favorite properties
 */
router.get('/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📋 GET favorites for user:', userId);

    const user = await User.findById(userId).select('favorites');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('✅ Retrieved', (user.favorites || []).length, 'favorites');

    res.json({
      success: true,
      data: user.favorites || []
    });

  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites',
      details: error.message
    });
  }
});

// ============================================
// 🆕 USER PREFERENCES ENDPOINTS
// ============================================

/**
 * PUT /api/users/:userId/preferences
 * Update user preferences
 */
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    console.log('⚙️ Update preferences for user:', userId);

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.preferences = {
      ...user.preferences,
      ...preferences
    };

    await user.save();

    console.log('✅ Preferences updated');

    res.json({
      success: true,
      message: 'Preferences updated',
      data: user.preferences
    });

  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      details: error.message
    });
  }
});

// ============================================
// USER PROFILE ENDPOINTS
// ============================================

/**
 * GET /api/users/:userId
 * Get user profile
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📥 GET user profile:', userId);
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User profile retrieved');
    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: error.message 
    });
  }
});

/**
 * DEBUG: Get raw user data
 */
router.get('/:userId/debug', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        comparisonList: user.comparisonList,
        comparisonListLength: user.comparisonList?.length || 0,
        viewedProperties: user.viewedProperties?.length || 0,
        searchHistory: user.searchHistory?.length || 0,
        favorites: user.favorites?.length || 0,
        rawData: user.toObject()
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;