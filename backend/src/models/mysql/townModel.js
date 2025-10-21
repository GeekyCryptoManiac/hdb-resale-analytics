// backend/src/models/townModel.js
const { pool } = require('../../config/database');

/**
 * Get all towns
 */
async function getAllTowns() {
    const [rows] = await pool.query(`
        SELECT 
            town_id,
            town_name,
            created_at,
            updated_at
        FROM Town
        ORDER BY town_name ASC
    `);
    return rows;
}

/**
 * Get town by ID
 */
async function getTownById(townId) {
    const [rows] = await pool.query(`
        SELECT 
            town_id,
            town_name,
            created_at,
            updated_at
        FROM Town
        WHERE town_id = ?
    `, [townId]);
    return rows[0];
}

/**
 * Get town with transaction statistics
 */
async function getTownWithStats(townId) {
    const [rows] = await pool.query(`
        SELECT 
            t.town_id,
            t.town_name,
            COUNT(tr.transaction_id) AS total_transactions,
            MIN(tr.price) AS min_price,
            MAX(tr.price) AS max_price,
            ROUND(AVG(tr.price), 2) AS avg_price,
            ROUND(AVG(tr.floor_area_sqm), 2) AS avg_floor_area,
            ROUND(AVG(tr.price_per_sqm), 2) AS avg_price_per_sqm
        FROM Town t
        LEFT JOIN Block b ON t.town_id = b.town_id
        LEFT JOIN Transaction tr ON b.block_id = tr.block_id
        WHERE t.town_id = ?
        GROUP BY t.town_id, t.town_name
    `, [townId]);
    return rows[0];
}

/**
 * Get all towns with transaction counts
 */
async function getAllTownsWithCounts() {
    const [rows] = await pool.query(`
        SELECT 
            t.town_id,
            t.town_name,
            COUNT(tr.transaction_id) AS transaction_count,
            ROUND(AVG(tr.price), 2) AS avg_price
        FROM Town t
        LEFT JOIN Block b ON t.town_id = b.town_id
        LEFT JOIN Transaction tr ON b.block_id = tr.block_id
        GROUP BY t.town_id, t.town_name
        ORDER BY transaction_count DESC
    `);
    return rows;
}

module.exports = {
    getAllTowns,
    getTownById,
    getTownWithStats,
    getAllTownsWithCounts
};