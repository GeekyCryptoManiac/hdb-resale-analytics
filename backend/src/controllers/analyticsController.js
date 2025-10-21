// backend/src/controllers/analyticsController.js
const { pool } = require('../config/database');

/**
 * Get overall statistics
 * GET /api/analytics/statistics
 */
async function getOverallStatistics(req, res, next) {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_transactions,
                COUNT(DISTINCT b.town_id) AS total_towns,
                COUNT(DISTINCT t.flat_type_id) AS total_flat_types,
                MIN(t.price) AS min_price,
                MAX(t.price) AS max_price,
                ROUND(AVG(t.price), 2) AS avg_price,
                ROUND(STDDEV(t.price), 2) AS stddev_price,
                ROUND(AVG(t.floor_area_sqm), 2) AS avg_floor_area,
                ROUND(AVG(t.price_per_sqm), 2) AS avg_price_per_sqm,
                MIN(t.month) AS earliest_transaction,
                MAX(t.month) AS latest_transaction
            FROM Transaction t
            JOIN Block b ON t.block_id = b.block_id
        `);
        
        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get price trends by month
 * GET /api/analytics/price-trends
 * Query params: months (default: 12), town, flatType
 */
async function getPriceTrends(req, res, next) {
    try {
        const months = req.query.months ? parseInt(req.query.months) : 12;
        const town = req.query.town;
        const flatType = req.query.flatType;
        
        let query = `
            SELECT 
                t.month,
                COUNT(*) AS transaction_count,
                ROUND(AVG(t.price), 2) AS avg_price,
                MIN(t.price) AS min_price,
                MAX(t.price) AS max_price,
                ROUND(AVG(t.price_per_sqm), 2) AS avg_price_per_sqm
            FROM Transaction t
            JOIN Block b ON t.block_id = b.block_id
            JOIN Town town ON b.town_id = town.town_id
            JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (town) {
            query += ` AND town.town_name = ?`;
            params.push(town);
        }
        
        if (flatType) {
            query += ` AND ft.flat_type_name = ?`;
            params.push(flatType);
        }
        
        query += `
            GROUP BY t.month
            ORDER BY t.month DESC
            LIMIT ?
        `;
        params.push(months);
        
        const [trends] = await pool.query(query, params);
        
        res.json({
            success: true,
            count: trends.length,
            filters: {
                months,
                town,
                flatType
            },
            data: trends.reverse() // Return in chronological order
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get town comparison
 * GET /api/analytics/town-comparison
 */
async function getTownComparison(req, res, next) {
    try {
        const [comparison] = await pool.query(`
            SELECT 
                town.town_name,
                COUNT(*) AS transaction_count,
                ROUND(AVG(t.price), 2) AS avg_price,
                MIN(t.price) AS min_price,
                MAX(t.price) AS max_price,
                ROUND(AVG(t.floor_area_sqm), 2) AS avg_floor_area,
                ROUND(AVG(t.price_per_sqm), 2) AS avg_price_per_sqm
            FROM Transaction t
            JOIN Block b ON t.block_id = b.block_id
            JOIN Town town ON b.town_id = town.town_id
            GROUP BY town.town_name
            ORDER BY avg_price DESC
        `);
        
        res.json({
            success: true,
            count: comparison.length,
            data: comparison
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get flat type comparison
 * GET /api/analytics/flat-type-comparison
 */
async function getFlatTypeComparison(req, res, next) {
    try {
        const [comparison] = await pool.query(`
            SELECT 
                ft.flat_type_name,
                COUNT(*) AS transaction_count,
                ROUND(AVG(t.price), 2) AS avg_price,
                MIN(t.price) AS min_price,
                MAX(t.price) AS max_price,
                ROUND(AVG(t.floor_area_sqm), 2) AS avg_floor_area,
                ROUND(AVG(t.price_per_sqm), 2) AS avg_price_per_sqm
            FROM Transaction t
            JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
            GROUP BY ft.flat_type_name, ft.typical_rooms
            ORDER BY ft.typical_rooms ASC
        `);
        
        res.json({
            success: true,
            count: comparison.length,
            data: comparison
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get price distribution (for histogram/chart)
 * GET /api/analytics/price-distribution
 */
async function getPriceDistribution(req, res, next) {
    try {
        const bucketSize = req.query.bucketSize ? parseInt(req.query.bucketSize) : 50000;
        
        const [distribution] = await pool.query(`
            SELECT 
                FLOOR(price / ?) * ? AS price_bucket,
                COUNT(*) AS count
            FROM Transaction
            GROUP BY price_bucket
            ORDER BY price_bucket ASC
        `, [bucketSize, bucketSize]);
        
        res.json({
            success: true,
            bucketSize,
            count: distribution.length,
            data: distribution
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getOverallStatistics,
    getPriceTrends,
    getTownComparison,
    getFlatTypeComparison,
    getPriceDistribution
};