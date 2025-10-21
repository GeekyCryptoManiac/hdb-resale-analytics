// backend/src/controllers/propertyController.js
const propertyModel = require('../models/mysql/propertyModel');
/**
 * Search properties with filters
 * GET /api/properties/search
 * Query params: towns, flatTypes, minPrice, maxPrice, minFloorArea, maxFloorArea, minRemainingLease, sortBy, sortOrder, limit, page
 */
async function searchProperties(req, res, next) {
    try {
        // Extract query parameters
        const filters = {
            towns: req.query.towns ? req.query.towns.split(',') : undefined,
            flatTypes: req.query.flatTypes ? req.query.flatTypes.split(',') : undefined,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            minFloorArea: req.query.minFloorArea ? parseFloat(req.query.minFloorArea) : undefined,
            maxFloorArea: req.query.maxFloorArea ? parseFloat(req.query.maxFloorArea) : undefined,
            minRemainingLease: req.query.minRemainingLease ? parseInt(req.query.minRemainingLease) : undefined,
            sortBy: req.query.sortBy || 't.month',
            sortOrder: req.query.sortOrder || 'DESC',
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.page ? (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 100) : 0
        };
        
        // Get properties and total count
        const [properties, totalCount] = await Promise.all([
            propertyModel.searchProperties(filters),
            propertyModel.getTransactionCount(filters)
        ]);
        
        // Calculate pagination info
        const limit = filters.limit;
        const currentPage = Math.floor(filters.offset / limit) + 1;
        const totalPages = Math.ceil(totalCount / limit);
        
        res.json({
            success: true,
            count: properties.length,
            pagination: {
                currentPage,
                totalPages,
                totalCount,
                limit,
                hasMore: currentPage < totalPages
            },
            filters: {
                towns: filters.towns,
                flatTypes: filters.flatTypes,
                priceRange: {
                    min: filters.minPrice,
                    max: filters.maxPrice
                },
                floorAreaRange: {
                    min: filters.minFloorArea,
                    max: filters.maxFloorArea
                },
                minRemainingLease: filters.minRemainingLease
            },
            data: properties
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get property by transaction ID
 * GET /api/properties/:id
 */
async function getPropertyById(req, res, next) {
    try {
        const transactionId = req.params.id;
        const property = await propertyModel.getPropertyById(transactionId);
        
        if (!property) {
            return res.status(404).json({
                success: false,
                error: 'Property not found'
            });
        }
        
        res.json({
            success: true,
            data: property
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get recent transactions
 * GET /api/properties/recent
 */
async function getRecentTransactions(req, res, next) {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const properties = await propertyModel.getRecentTransactions(limit);
        
        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    searchProperties,
    getPropertyById,
    getRecentTransactions
};