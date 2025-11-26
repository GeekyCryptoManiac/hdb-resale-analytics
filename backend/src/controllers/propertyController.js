// backend/src/controllers/propertyController.js
const propertyModel = require('../models/mysql/propertyModel');
const { pool } = require('../config/database');

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
 * ✨ ENHANCED: Returns full property details with all JOINs
 */
async function getPropertyById(req, res, next) {
    try {
        const transactionId = req.params.id;
        
        const query = `
            SELECT 
                t.transaction_id,
                t.month,
                t.price,
                t.floor_area_sqm,
                b.block_number,
                b.street_name,
                town.town_name,
                ft.flat_type_name,
                fm.flat_model_name,
                sr.range AS storey_range,
                l.remaining_lease_years,
                l.remaining_lease_months
            FROM Transaction t
            JOIN Block b ON t.block_id = b.block_id
            JOIN Town town ON b.town_id = town.town_id
            JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
            JOIN FlatModel fm ON t.flat_model_id = fm.flat_model_id
            JOIN StoreyRange sr ON t.storey_id = sr.storey_id
            JOIN Lease l ON t.lease_id = l.lease_id
            WHERE t.transaction_id = ?
        `;
        
        const [rows] = await pool.query(query, [transactionId]);
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Property not found'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
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

/**
 * 🆕 NEW: Get block transaction history
 * GET /api/properties/block-history
 * Query params: block_number, street_name
 * 
 * Returns all transactions for a specific block (up to 50 most recent)
 */
async function getBlockHistory(req, res, next) {
    const { block_number, street_name } = req.query;
    
    if (!block_number || !street_name) {
        return res.status(400).json({ 
            success: false,
            error: 'block_number and street_name are required' 
        });
    }
    
    try {
        const query = `
            SELECT 
                t.transaction_id,
                t.month,
                t.price,
                t.floor_area_sqm,
                ft.flat_type_name,
                sr.range AS storey_range,
                l.remaining_lease_years
            FROM Transaction t
            JOIN Block b ON t.block_id = b.block_id
            JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
            JOIN StoreyRange sr ON t.storey_id = sr.storey_id
            JOIN Lease l ON t.lease_id = l.lease_id
            WHERE b.block_number = ? AND b.street_name = ?
            ORDER BY t.month DESC
            LIMIT 50
        `;
        
        const [rows] = await pool.query(query, [block_number, street_name]);
        
        res.json({ 
            success: true, 
            data: rows 
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    searchProperties,
    getPropertyById,
    getRecentTransactions,
    getBlockHistory          // 🆕 NEW EXPORT
};