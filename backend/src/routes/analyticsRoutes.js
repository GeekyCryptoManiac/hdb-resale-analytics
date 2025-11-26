// backend/src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// ============= EXISTING ROUTES =============
// GET /api/analytics/statistics - Get overall statistics
router.get('/statistics', analyticsController.getOverallStatistics);

// GET /api/analytics/price-trends - Get price trends over time
router.get('/price-trends', analyticsController.getPriceTrends);

// GET /api/analytics/town-comparison - Compare towns
router.get('/town-comparison', analyticsController.getTownComparison);

// GET /api/analytics/flat-type-comparison - Compare flat types
router.get('/flat-type-comparison', analyticsController.getFlatTypeComparison);

// GET /api/analytics/price-distribution - Get price distribution
router.get('/price-distribution', analyticsController.getPriceDistribution);

// GET /api/analytics/get-price-avg - Get price avg
router.get('/get-price-avg', analyticsController.getPriceAvg);

// GET /api/analytics/heatmap - Heat map data
router.get('/heatmap', analyticsController.getHeatmapData);

// ============= NEW ROUTES FOR PROPERTY DETAIL PAGE =============
// GET /api/analytics/town-trends - Get price trends for town/flat type
router.get('/town-trends', analyticsController.getTownTrends);

// POST /api/analytics/predict - Get price predictions
router.post('/predict', analyticsController.getPricePrediction);

module.exports = router;