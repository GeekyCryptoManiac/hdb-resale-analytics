// backend/src/routes/townRoutes.js
const express = require('express');
const router = express.Router();
const townController = require('../controllers/townController');

// GET /api/towns - Get all towns
router.get('/', townController.getAllTowns);

// GET /api/towns/stats - Get all towns with statistics
router.get('/stats', townController.getAllTownsWithStats);

// GET /api/towns/:id - Get single town by ID
router.get('/:id', townController.getTownById);

// GET /api/towns/:id/stats - Get town with statistics
router.get('/:id/stats', townController.getTownWithStats);

module.exports = router;