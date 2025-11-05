// backend/src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

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

module.exports = router;