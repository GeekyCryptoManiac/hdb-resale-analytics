// backend/src/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// GET /api/properties/recent - Get recent transactions (must be before /:id)
router.get('/recent', propertyController.getRecentTransactions);

// GET /api/properties/search - Search properties with filters
router.get('/search', propertyController.searchProperties);

// GET /api/properties/:id - Get property by transaction ID
router.get('/:id', propertyController.getPropertyById);

module.exports = router;