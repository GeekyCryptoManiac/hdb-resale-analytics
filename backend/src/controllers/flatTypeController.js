// backend/src/controllers/flatTypeController.js
const flatTypeModel = require('../models/mysql/flatTypeModel');

/**
 * Get all flat types
 * GET /api/flat-types
 */
async function getAllFlatTypes(req, res, next) {
    try {
        const flatTypes = await flatTypeModel.getAllFlatTypes();
        
        res.json({
            success: true,
            count: flatTypes.length,
            data: flatTypes
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all flat types with statistics
 * GET /api/flat-types/stats
 */
async function getAllFlatTypesWithStats(req, res, next) {
    try {
        const flatTypes = await flatTypeModel.getAllFlatTypesWithStats();
        
        res.json({
            success: true,
            count: flatTypes.length,
            data: flatTypes
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get single flat type by ID
 * GET /api/flat-types/:id
 */
async function getFlatTypeById(req, res, next) {
    try {
        const flatTypeId = req.params.id;
        const flatType = await flatTypeModel.getFlatTypeById(flatTypeId);
        
        if (!flatType) {
            return res.status(404).json({
                success: false,
                error: 'Flat type not found'
            });
        }
        
        res.json({
            success: true,
            data: flatType
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllFlatTypes,
    getAllFlatTypesWithStats,
    getFlatTypeById
};