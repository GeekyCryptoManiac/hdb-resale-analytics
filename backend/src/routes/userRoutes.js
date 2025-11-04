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
 * Add property to comparison list - RELIABLE VERSION
 */
router.post('/:userId/comparison', async (req, res) => {
  try {
    const { userId } = req.params;
    const { property } = req.body;

    console.log('📥 POST add to comparison for user:', userId);

    // Validate property data
    if (!property) {
      console.log('❌ No property data provided');
      return res.status(400).json({ error: 'Property data is required' });
    }

    if (!property.transaction_id) {
      console.log('❌ Property missing transaction_id');
      return res.status(400).json({ error: 'Property must have transaction_id' });
    }

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('📋 Current comparison list BEFORE:', user.comparisonList?.length || 0, 'items');

    // Initialize comparisonList if it doesn't exist
    if (!user.comparisonList) {
      user.comparisonList = [];
      console.log('📝 Initialized empty comparison list');
    }

    // Check if property already exists
    const alreadyExists = user.comparisonList.some(
      item => item.transaction_id == property.transaction_id
    );

    if (alreadyExists) {
      console.log('⚠️ Property already in comparison list');
      return res.status(400).json({ error: 'Property already in comparison list' });
    }

    // Check limit (max 3 properties)
    if (user.comparisonList.length >= 3) {
      console.log('⚠️ Comparison list full (max 3)');
      return res.status(400).json({ 
        error: 'Maximum 3 properties allowed in comparison list' 
      });
    }

    // Add property to comparison list
    user.comparisonList.push(property);
    console.log('➕ Added property to list. New size:', user.comparisonList.length);

    // CRITICAL: Mark the field as modified and save
    user.markModified('comparisonList');
    
    // Save with proper error handling
    await user.save();
    console.log('💾 User saved successfully');

    // Verify the save worked by refetching
    const verifiedUser = await User.findById(userId);
    console.log('🔍 Verification - comparison list size:', verifiedUser.comparisonList?.length || 0);

    res.json({
      message: 'Property added to comparison',
      comparisonList: user.comparisonList,
      verifiedSize: verifiedUser.comparisonList?.length || 0
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
 * Remove property from comparison list - RELIABLE VERSION
 */
router.delete('/:userId/comparison/:transactionId', async (req, res) => {
  try {
    const { userId, transactionId } = req.params;
    console.log('📥 DELETE from comparison - User:', userId, 'Transaction:', transactionId);

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('📋 Current comparison list:', user.comparisonList?.length || 0, 'items');

    if (!user.comparisonList || user.comparisonList.length === 0) {
      console.log('⚠️ Comparison list is empty');
      return res.status(404).json({ error: 'Comparison list is empty' });
    }

    // Log all items for debugging
    console.log('🔍 All items in comparison list:');
    user.comparisonList.forEach((item, index) => {
      console.log(`  [${index}] transaction_id:`, item.transaction_id, 'type:', typeof item.transaction_id);
    });

    const initialLength = user.comparisonList.length;
    
    // Filter out the item to remove
    user.comparisonList = user.comparisonList.filter(item => {
      const keep = item.transaction_id != transactionId;
      if (!keep) {
        console.log('🗑️ Removing item with transaction_id:', item.transaction_id);
      }
      return keep;
    });

    const finalLength = user.comparisonList.length;
    console.log(`🔄 List changed from ${initialLength} to ${finalLength} items`);

    if (initialLength === finalLength) {
      console.log('⚠️ Property not found in comparison list');
      return res.status(404).json({ error: 'Property not found in comparison list' });
    }

    // CRITICAL: Mark the field as modified
    user.markModified('comparisonList');
    await user.save();
    
    console.log('💾 User saved successfully');

    // Verify the save worked
    const verifiedUser = await User.findById(userId);
    console.log('🔍 Verification - comparison list size:', verifiedUser.comparisonList?.length || 0);

    res.json({
      message: 'Property removed from comparison',
      comparisonList: user.comparisonList,
      verifiedSize: verifiedUser.comparisonList?.length || 0
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

// Add this temporary debug route to userRoutes.js
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
        rawData: user.toObject()
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;