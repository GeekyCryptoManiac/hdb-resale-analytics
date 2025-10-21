// backend/src/routes/flatTypeRoutes.js
const express = require('express');
const router = express.Router();
const flatTypeController = require('../controllers/flatTypeController');

// GET /api/flat-types - Get all flat types
router.get('/', flatTypeController.getAllFlatTypes);

// GET /api/flat-types/stats - Get all flat types with statistics
router.get('/stats', flatTypeController.getAllFlatTypesWithStats);

// GET /api/flat-types/:id - Get single flat type by ID
router.get('/:id', flatTypeController.getFlatTypeById);

module.exports = router;