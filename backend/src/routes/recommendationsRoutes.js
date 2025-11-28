const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');

/**
 * GET /api/recommendations/:userId
 * Get personalized property recommendations
 * Matches the pattern from userRoutes.js
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    console.log('🎯 GET recommendations for user:', userId, 'limit:', limit);

    const result = await recommendationService.getRecommendations(userId, limit);
    
    console.log('✅ Recommendations retrieved:', result.recommendations?.length || 0);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Recommendations API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

module.exports = router;