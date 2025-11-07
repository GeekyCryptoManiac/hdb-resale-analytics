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

    // Initialize comparisonList if undefined
    if (!user.comparisonList) {
      user.comparisonList = [];
    }

    console.log('📋 Current comparison list BEFORE:', user.comparisonList.length, 'items');

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

    // Sanitize property data - keep only needed fields
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

    // Use $push operator for atomic update
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

    // Double-check with a fresh query
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
    console.log('🔍 Transaction ID type:', typeof transactionId);

    // Convert transactionId to number for comparison
    const numericTransactionId = Number(transactionId);
    console.log('🔢 Numeric transaction ID:', numericTransactionId);

    // Use $pull operator for atomic removal
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

    // Verify with fresh query
    const verifiedUser = await User.findById(userId).select('comparisonList');
    console.log('🔍 Fresh query verification:', verifiedUser.comparisonList?.length || 0);

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