const User = require('../models/User');

/**
 * Track property view
 * POST /api/users/:userId/track-view
 */
exports.trackPropertyView = async (req, res) => {
  try {
    const { userId } = req.params;
    const { transaction_id, timestamp } = req.body;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: 'transaction_id is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if property already viewed
    const existingView = user.viewedProperties.find(
      view => view.transaction_id === parseInt(transaction_id)
    );

    if (existingView) {
      // Increment view count and update timestamp
      existingView.viewCount += 1;
      existingView.timestamp = new Date(timestamp || Date.now());
    } else {
      // Add new view
      user.viewedProperties.push({
        transaction_id: parseInt(transaction_id),
        timestamp: new Date(timestamp || Date.now()),
        viewCount: 1
      });
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
    console.error('Error tracking property view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track property view',
      details: error.message
    });
  }
};

/**
 * Track search query
 * POST /api/users/:userId/track-search
 */
exports.trackSearch = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timestamp, resultsCount, ...searchQuery } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add search to history
    user.searchHistory.push({
      query: searchQuery,
      timestamp: new Date(timestamp || Date.now()),
      resultsCount: resultsCount || 0
    });

    // Keep only last 50 searches
    if (user.searchHistory.length > 50) {
      user.searchHistory = user.searchHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Search tracked'
    });

  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track search',
      details: error.message
    });
  }
};

/**
 * Get user's search history
 * GET /api/users/:userId/search-history
 */
exports.getSearchHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const searchHistory = user.searchHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json({
      success: true,
      data: searchHistory
    });

  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search history',
      details: error.message
    });
  }
};

/**
 * Get user's viewed properties
 * GET /api/users/:userId/viewed-properties
 */
exports.getViewedProperties = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const viewedProperties = user.viewedProperties
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json({
      success: true,
      data: viewedProperties
    });

  } catch (error) {
    console.error('Error fetching viewed properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch viewed properties',
      details: error.message
    });
  }
};

/**
 * Add to favorites
 * POST /api/users/:userId/favorites
 */
exports.addToFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { transaction_id } = req.body;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: 'transaction_id is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
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

    res.json({
      success: true,
      message: 'Added to favorites',
      data: { transaction_id }
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to favorites',
      details: error.message
    });
  }
};

/**
 * Remove from favorites
 * DELETE /api/users/:userId/favorites/:transactionId
 */
exports.removeFromFavorites = async (req, res) => {
  try {
    const { userId, transactionId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.favorites = user.favorites.filter(
      fav => fav.transaction_id !== parseInt(transactionId)
    );

    await user.save();

    res.json({
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from favorites',
      details: error.message
    });
  }
};

/**
 * Get user's favorites
 * GET /api/users/:userId/favorites
 */
exports.getFavorites = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.favorites
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites',
      details: error.message
    });
  }
};

/**
 * Update user preferences
 * PUT /api/users/:userId/preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
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

    res.json({
      success: true,
      message: 'Preferences updated',
      data: user.preferences
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      details: error.message
    });
  }
};