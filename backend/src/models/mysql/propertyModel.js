// backend/src/models/propertyModel.js
const { pool } = require('../../config/database');

/**
 * Search properties with filters
 */
async function searchProperties(filters = {}) {
    let query = `
        SELECT 
            t.transaction_id,
            t.month,
            t.price,
            t.floor_area_sqm,
            t.price_per_sqm,
            town.town_name,
            b.block_number,
            b.street_name,
            ft.flat_type_name,
            fm.flat_model_name,
            sr.\`range\` AS storey_range,
            l.lease_commence_year,
            l.remaining_lease_years,
            l.remaining_lease_months
        FROM Transaction t
        JOIN Block b ON t.block_id = b.block_id
        JOIN Town town ON b.town_id = town.town_id
        JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
        JOIN FlatModel fm ON t.flat_model_id = fm.flat_model_id
        JOIN StoreyRange sr ON t.storey_id = sr.storey_id
        JOIN Lease l ON t.lease_id = l.lease_id
        WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (filters.towns && filters.towns.length > 0) {
        query += ` AND town.town_name IN (?)`;
        params.push(filters.towns);
    }
    
    if (filters.flatTypes && filters.flatTypes.length > 0) {
        query += ` AND ft.flat_type_name IN (?)`;
        params.push(filters.flatTypes);
    }
    
    if (filters.minPrice) {
        query += ` AND t.price >= ?`;
        params.push(filters.minPrice);
    }
    
    if (filters.maxPrice) {
        query += ` AND t.price <= ?`;
        params.push(filters.maxPrice);
    }
    
    if (filters.minFloorArea) {
        query += ` AND t.floor_area_sqm >= ?`;
        params.push(filters.minFloorArea);
    }
    
    if (filters.maxFloorArea) {
        query += ` AND t.floor_area_sqm <= ?`;
        params.push(filters.maxFloorArea);
    }
    
    if (filters.minRemainingLease) {
        query += ` AND l.remaining_lease_years >= ?`;
        params.push(filters.minRemainingLease);
    }
    
    // Sorting
    const sortBy = filters.sortBy || 'month';
    const sortOrder = filters.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    
    // Pagination
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Get property by transaction ID
 */
async function getPropertyById(transactionId) {
    const [rows] = await pool.query(`
        SELECT 
            t.transaction_id,
            t.month,
            t.price,
            t.floor_area_sqm,
            t.price_per_sqm,
            town.town_id,
            town.town_name,
            b.block_id,
            b.block_number,
            b.street_name,
            ft.flat_type_id,
            ft.flat_type_name,
            fm.flat_model_id,
            fm.flat_model_name,
            sr.storey_id,
            sr.\`range\` AS storey_range,
            l.lease_id,
            l.lease_commence_year,
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
    `, [transactionId]);
    return rows[0];
}

/**
 * Get recent transactions (for homepage)
 */
async function getRecentTransactions(limit = 20) {
    const [rows] = await pool.query(`
        SELECT 
            t.transaction_id,
            t.month,
            t.price,
            t.floor_area_sqm,
            t.price_per_sqm,
            town.town_name,
            CONCAT(b.block_number, ' ', b.street_name) AS address,
            ft.flat_type_name,
            fm.flat_model_name
        FROM Transaction t
        JOIN Block b ON t.block_id = b.block_id
        JOIN Town town ON b.town_id = town.town_id
        JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
        JOIN FlatModel fm ON t.flat_model_id = fm.flat_model_id
        ORDER BY t.month DESC, t.transaction_id DESC
        LIMIT ?
    `, [limit]);
    return rows;
}

/**
 * Get transaction count with optional filters
 */
async function getTransactionCount(filters = {}) {
    let query = `
        SELECT COUNT(*) as count
        FROM Transaction t
        JOIN Block b ON t.block_id = b.block_id
        JOIN Town town ON b.town_id = town.town_id
        JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
        JOIN Lease l ON t.lease_id = l.lease_id
        WHERE 1=1
    `;
    
    const params = [];
    
    // Apply same filters as search
    if (filters.towns && filters.towns.length > 0) {
        query += ` AND town.town_name IN (?)`;
        params.push(filters.towns);
    }
    
    if (filters.flatTypes && filters.flatTypes.length > 0) {
        query += ` AND ft.flat_type_name IN (?)`;
        params.push(filters.flatTypes);
    }
    
    if (filters.minPrice) {
        query += ` AND t.price >= ?`;
        params.push(filters.minPrice);
    }
    
    if (filters.maxPrice) {
        query += ` AND t.price <= ?`;
        params.push(filters.maxPrice);
    }
    
    if (filters.minFloorArea) {
        query += ` AND t.floor_area_sqm >= ?`;
        params.push(filters.minFloorArea);
    }
    
    if (filters.maxFloorArea) {
        query += ` AND t.floor_area_sqm <= ?`;
        params.push(filters.maxFloorArea);
    }
    
    if (filters.minRemainingLease) {
        query += ` AND l.remaining_lease_years >= ?`;
        params.push(filters.minRemainingLease);
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0].count;
}

module.exports = {
    searchProperties,
    getPropertyById,
    getRecentTransactions,
    getTransactionCount
};