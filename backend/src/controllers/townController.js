// backend/src/controllers/townController.js
const townModel = require('../models/mysql/townModel');

/**
 * Get all towns
 * GET /api/towns
 */
async function getAllTowns(req, res, next) {
    try {
        const towns = await townModel.getAllTowns();
        
        res.json({
            success: true,
            count: towns.length,
            data: towns
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all towns with transaction counts
 * GET /api/towns/stats
 */
async function getAllTownsWithStats(req, res, next) {
    try {
        const towns = await townModel.getAllTownsWithCounts();
        
        res.json({
            success: true,
            count: towns.length,
            data: towns
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get single town by ID
 * GET /api/towns/:id
 */
async function getTownById(req, res, next) {
    try {
        const townId = req.params.id;
        const town = await townModel.getTownById(townId);
        
        if (!town) {
            return res.status(404).json({
                success: false,
                error: 'Town not found'
            });
        }
        
        res.json({
            success: true,
            data: town
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get town with statistics
 * GET /api/towns/:id/stats
 */
async function getTownWithStats(req, res, next) {
    try {
        const townId = req.params.id;
        const town = await townModel.getTownWithStats(townId);
        
        if (!town) {
            return res.status(404).json({
                success: false,
                error: 'Town not found'
            });
        }
        
        res.json({
            success: true,
            data: town
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllTowns,
    getAllTownsWithStats,
    getTownById,
    getTownWithStats
};