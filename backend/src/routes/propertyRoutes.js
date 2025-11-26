// backend/src/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// ============= EXISTING ROUTES =============
// GET /api/properties/recent - Get recent transactions (must be before /:id)
router.get('/recent', propertyController.getRecentTransactions);

// GET /api/properties/search - Search properties with filters
router.get('/search', propertyController.searchProperties);

// ============= NEW ROUTES (specific routes BEFORE parameterized routes) =============
// GET /api/properties/block-history - Get block transaction history
router.get('/block-history', propertyController.getBlockHistory);

// ============= PARAMETERIZED ROUTES (MUST BE LAST) =============
// GET /api/properties/:id - Get property by transaction ID
router.get('/:id', propertyController.getPropertyById);


module.exports = router;