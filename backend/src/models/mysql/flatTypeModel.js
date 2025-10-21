// backend/src/models/flatTypeModel.js
const { pool } = require('../../config/database');

/**
 * Get all flat types
 */
async function getAllFlatTypes() {
    const [rows] = await pool.query(`
        SELECT 
            flat_type_id,
            flat_type_name,
            typical_rooms,
            created_at,
            updated_at
        FROM FlatType
        ORDER BY typical_rooms ASC
    `);
    return rows;
}

/**
 * Get flat type by ID
 */
async function getFlatTypeById(flatTypeId) {
    const [rows] = await pool.query(`
        SELECT 
            flat_type_id,
            flat_type_name,
            typical_rooms,
            created_at,
            updated_at
        FROM FlatType
        WHERE flat_type_id = ?
    `, [flatTypeId]);
    return rows[0];
}

/**
 * Get all flat types with statistics
 */
async function getAllFlatTypesWithStats() {
    const [rows] = await pool.query(`
        SELECT 
            ft.flat_type_id,
            ft.flat_type_name,
            ft.typical_rooms,
            COUNT(t.transaction_id) AS transaction_count,
            MIN(t.price) AS min_price,
            MAX(t.price) AS max_price,
            ROUND(AVG(t.price), 2) AS avg_price,
            ROUND(AVG(t.floor_area_sqm), 2) AS avg_floor_area,
            ROUND(AVG(t.price_per_sqm), 2) AS avg_price_per_sqm
        FROM FlatType ft
        LEFT JOIN Transaction t ON ft.flat_type_id = t.flat_type_id
        GROUP BY ft.flat_type_id, ft.flat_type_name, ft.typical_rooms
        ORDER BY ft.typical_rooms ASC
    `);
    return rows;
}

module.exports = {
    getAllFlatTypes,
    getFlatTypeById,
    getAllFlatTypesWithStats
};