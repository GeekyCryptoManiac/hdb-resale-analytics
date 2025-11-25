// backend/src/controllers/analyticsController.js
const { pool } = require('../config/database');

/**
 * Get overall statistics
 * GET /api/analytics/statistics
 * ✨ ENHANCED: Uses CTEs for better organization and adds recent trend comparison
 */
async function getOverallStatistics(req, res, next) {
    try {
        const [stats] = await pool.query(`
            WITH BaseStats AS (
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
            ),
            RecentStats AS (
                -- 🆕 NEW: Get statistics for last 12 months for comparison
                SELECT 
                    COUNT(*) AS recent_transactions,
                    ROUND(AVG(t.price), 2) AS recent_avg_price
                FROM Transaction t
                WHERE t.month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 MONTH), '%Y-%m')
            )
            SELECT 
                bs.*,
                rs.recent_transactions,        -- 🆕 NEW: Transaction volume last 12 months
                rs.recent_avg_price,          -- 🆕 NEW: Average price last 12 months
                ROUND(((rs.recent_avg_price - bs.avg_price) / bs.avg_price) * 100, 2) AS recent_vs_overall_pct -- 🆕 NEW: Recent trend indicator
            FROM BaseStats bs
            CROSS JOIN RecentStats rs
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
 * ✨ ENHANCED: Uses window functions to add MoM changes, moving averages, and YoY comparison
 */
async function getPriceTrends(req, res, next) {
    try {
        const months = req.query.months ? parseInt(req.query.months) : 12;
        const town = req.query.town;
        const flatType = req.query.flatType;
        
        let whereConditions = [];
        const params = [];
        
        if (town) {
            whereConditions.push('town.town_name = ?');
            params.push(town);
        }
        
        if (flatType) {
            whereConditions.push('ft.flat_type_name = ?');
            params.push(flatType);
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        const query = `
            WITH MonthlyStats AS (
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
                ${whereClause}
                GROUP BY t.month
            ),
            TrendsWithAnalysis AS (
                SELECT 
                    month,
                    transaction_count,
                    avg_price,
                    min_price,
                    max_price,
                    avg_price_per_sqm,
                    -- 🆕 NEW: Previous month comparison using LAG
                    LAG(avg_price, 1) OVER (ORDER BY month) AS prev_month_price,
                    ROUND(avg_price - LAG(avg_price, 1) OVER (ORDER BY month), 2) AS price_change_mom,
                    ROUND(
                        ((avg_price - LAG(avg_price, 1) OVER (ORDER BY month)) / 
                        LAG(avg_price, 1) OVER (ORDER BY month)) * 100, 2
                    ) AS pct_change_mom,
                    -- 🆕 NEW: 3-month moving average for smoother trend line
                    ROUND(AVG(avg_price) OVER (
                        ORDER BY month 
                        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
                    ), 2) AS moving_avg_3month,
                    -- 🆕 NEW: Year-over-year comparison (12 months ago)
                    LAG(avg_price, 12) OVER (ORDER BY month) AS price_12months_ago,
                    ROUND(
                        ((avg_price - LAG(avg_price, 12) OVER (ORDER BY month)) / 
                        LAG(avg_price, 12) OVER (ORDER BY month)) * 100, 2
                    ) AS yoy_change_pct
                FROM MonthlyStats
            )
            SELECT *
            FROM TrendsWithAnalysis
            ORDER BY month DESC
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
 * ✨ ENHANCED: Uses CTEs and window functions to add rankings and national comparison context
 */
async function getTownComparison(req, res, next) {
    try {
        const [comparison] = await pool.query(`
            WITH NationalStats AS (
                -- Step 1: Calculate national baseline
                SELECT 
                    ROUND(AVG(price), 2) AS national_avg_price,
                    ROUND(AVG(price_per_sqm), 2) AS national_avg_psm
                FROM Transaction
            ),
            TownMetrics AS (
                -- Step 2: Calculate per-town metrics
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
            )
            SELECT 
                tm.town_name,
                tm.transaction_count,
                tm.avg_price,
                tm.avg_price_per_sqm,
                tm.min_price,
                tm.max_price,
                tm.avg_floor_area,
                -- 🆕 NEW: Window functions for rankings
                RANK() OVER (ORDER BY tm.avg_price DESC) AS price_rank,
                RANK() OVER (ORDER BY tm.avg_price_per_sqm DESC) AS psm_rank,
                RANK() OVER (ORDER BY tm.transaction_count DESC) AS volume_rank,
                -- 🆕 NEW: Comparison to national average
                ns.national_avg_price,
                ns.national_avg_psm,
                ROUND(tm.avg_price - ns.national_avg_price, 2) AS diff_from_national,
                ROUND(((tm.avg_price - ns.national_avg_price) / ns.national_avg_price) * 100, 2) AS pct_diff_from_national,
                ROUND(tm.avg_price_per_sqm - ns.national_avg_psm, 2) AS psm_diff_from_national,
                ROUND(((tm.avg_price_per_sqm - ns.national_avg_psm) / ns.national_avg_psm) * 100, 2) AS psm_pct_diff_from_national
            FROM TownMetrics tm
            CROSS JOIN NationalStats ns
            ORDER BY tm.avg_price DESC
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
 * ✨ ENHANCED: Adds rankings and price efficiency metrics
 */
async function getFlatTypeComparison(req, res, next) {
    try {
        const [comparison] = await pool.query(`
            WITH FlatTypeMetrics AS (
                SELECT 
                    ft.flat_type_name,
                    ft.typical_rooms,
                    COUNT(*) AS transaction_count,
                    ROUND(AVG(t.price), 2) AS avg_price,
                    MIN(t.price) AS min_price,
                    MAX(t.price) AS max_price,
                    ROUND(AVG(t.floor_area_sqm), 2) AS avg_floor_area,
                    ROUND(AVG(t.price_per_sqm), 2) AS avg_price_per_sqm
                FROM Transaction t
                JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
                GROUP BY ft.flat_type_name, ft.typical_rooms
            ),
            TotalTransactions AS (
                SELECT COUNT(*) AS total FROM Transaction
            )
            SELECT 
                ftm.flat_type_name,
                ftm.typical_rooms,
                ftm.transaction_count,
                ftm.avg_price,
                ftm.min_price,
                ftm.max_price,
                ftm.avg_floor_area,
                ftm.avg_price_per_sqm,
                -- 🆕 NEW: Rankings
                RANK() OVER (ORDER BY ftm.avg_price DESC) AS price_rank,
                RANK() OVER (ORDER BY ftm.avg_price_per_sqm ASC) AS price_efficiency_rank,
                -- 🆕 NEW: Market share percentage
                ROUND((ftm.transaction_count * 100.0 / tt.total), 2) AS market_share_pct,
                -- 🆕 NEW: Price per room (value metric)
                ROUND(ftm.avg_price / ftm.typical_rooms, 2) AS price_per_room
            FROM FlatTypeMetrics ftm
            CROSS JOIN TotalTransactions tt
            ORDER BY ftm.typical_rooms ASC
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
 * ✨ ENHANCED: Adds percentile information and cumulative distribution
 */
async function getPriceDistribution(req, res, next) {
    try {
        const bucketSize = req.query.bucketSize ? parseInt(req.query.bucketSize) : 50000;
        
        const [distribution] = await pool.query(`
            WITH PriceBuckets AS (
                SELECT 
                    FLOOR(price / ?) * ? AS price_bucket,
                    COUNT(*) AS count
                FROM Transaction
                WHERE price BETWEEN 100000 AND 1250000  -- Remove outliers
                GROUP BY price_bucket
            ),
            TotalCount AS (
                SELECT SUM(count) AS total FROM PriceBuckets
            )
            SELECT 
                pb.price_bucket,
                pb.count,
                -- 🆕 NEW: Percentage of total
                ROUND((pb.count * 100.0 / tc.total), 2) AS percentage,
                -- 🆕 NEW: Cumulative percentage (percentile)
                ROUND(
                    SUM(pb.count) OVER (ORDER BY pb.price_bucket) * 100.0 / tc.total, 
                    2
                ) AS cumulative_pct
            FROM PriceBuckets pb
            CROSS JOIN TotalCount tc
            ORDER BY pb.price_bucket ASC
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

/**
 * Get Avg Price of town each year
 * GET /api/analytics/get-price-avg
 * ✨ ENHANCED: Adds year-over-year growth calculation and rankings
 */
async function getPriceAvg(req, res, next) {
    try {
        const [comparison] = await pool.query(`
            WITH YearlyTownPrices AS (
                SELECT 
                    LEFT(t.month, 4) AS year,
                    town.town_name,
                    ROUND(AVG(t.price), 2) AS avg_price,
                    COUNT(*) AS transaction_count
                FROM Transaction t
                JOIN Block b ON t.block_id = b.block_id
                JOIN Town town ON b.town_id = town.town_id
                WHERE LEFT(t.month, 4) BETWEEN '2020' AND '2025'
                GROUP BY year, town.town_name
            )
            SELECT 
                year,
                town_name,
                avg_price,
                transaction_count,
                -- 🆕 NEW: Year-over-year price change
                LAG(avg_price, 1) OVER (PARTITION BY town_name ORDER BY year) AS prev_year_price,
                ROUND(
                    avg_price - LAG(avg_price, 1) OVER (PARTITION BY town_name ORDER BY year),
                    2
                ) AS yoy_price_change,
                ROUND(
                    ((avg_price - LAG(avg_price, 1) OVER (PARTITION BY town_name ORDER BY year)) /
                    LAG(avg_price, 1) OVER (PARTITION BY town_name ORDER BY year)) * 100,
                    2
                ) AS yoy_growth_pct,
                -- 🆕 NEW: Rank towns by price within each year
                RANK() OVER (PARTITION BY year ORDER BY avg_price DESC) AS price_rank_in_year
            FROM YearlyTownPrices
            ORDER BY year ASC, avg_price DESC
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
 * 🆕 NEW ENDPOINT: Get top appreciating towns
 * GET /api/analytics/top-appreciating-towns
 * Query params: year (default: current year), limit (default: 10)
 */
async function getTopAppreciatingTowns(req, res, next) {
    try {
        const year = req.query.year || new Date().getFullYear().toString();
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        
        const [towns] = await pool.query(`
            WITH YearlyTownPrices AS (
                SELECT 
                    town.town_name,
                    LEFT(t.month, 4) AS year,
                    ROUND(AVG(t.price), 2) AS avg_price,
                    COUNT(*) AS transactions
                FROM Transaction t
                JOIN Block b ON t.block_id = b.block_id
                JOIN Town town ON b.town_id = town.town_id
                GROUP BY town.town_name, LEFT(t.month, 4)
            ),
            TownGrowth AS (
                SELECT 
                    town_name,
                    year,
                    avg_price,
                    transactions,
                    LAG(avg_price, 1) OVER (PARTITION BY town_name ORDER BY year) AS prev_year_price,
                    ROUND(
                        ((avg_price - LAG(avg_price, 1) OVER (PARTITION BY town_name ORDER BY year)) /
                        LAG(avg_price, 1) OVER (PARTITION BY town_name ORDER BY year)) * 100, 2
                    ) AS yoy_growth_pct
                FROM YearlyTownPrices
            )
            SELECT 
                town_name,
                year,
                avg_price,
                prev_year_price,
                yoy_growth_pct,
                transactions,
                RANK() OVER (ORDER BY yoy_growth_pct DESC) AS growth_rank
            FROM TownGrowth
            WHERE year = ? 
                AND prev_year_price IS NOT NULL
                AND yoy_growth_pct IS NOT NULL
            ORDER BY yoy_growth_pct DESC
            LIMIT ?
        `, [year, limit]);
        
        res.json({
            success: true,
            year,
            count: towns.length,
            data: towns
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 🆕 NEW ENDPOINT: Get lease depreciation analysis
 * GET /api/analytics/lease-depreciation
 * Shows how prices change across different remaining lease periods
 */
async function getLeaseDepreciation(req, res, next) {
    try {
        const flatType = req.query.flatType; // Optional filter
        
        let whereClause = '';
        const params = [];
        
        if (flatType) {
            whereClause = 'WHERE ft.flat_type_name = ?';
            params.push(flatType);
        }
        
        const [depreciation] = await pool.query(`
            WITH LeaseCategories AS (
                SELECT 
                    t.transaction_id,
                    t.price,
                    t.price_per_sqm,
                    ft.flat_type_name,
                    l.remaining_lease,
                    CASE 
                        WHEN l.remaining_lease >= 90 THEN '90+ years'
                        WHEN l.remaining_lease >= 80 THEN '80-89 years'
                        WHEN l.remaining_lease >= 70 THEN '70-79 years'
                        WHEN l.remaining_lease >= 60 THEN '60-69 years'
                        ELSE 'Below 60 years'
                    END AS lease_band
                FROM Transaction t
                JOIN Lease l ON t.lease_id = l.lease_id
                JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
                ${whereClause}
            ),
            LeaseAnalysis AS (
                SELECT 
                    flat_type_name,
                    lease_band,
                    COUNT(*) AS transaction_count,
                    ROUND(AVG(price), 2) AS avg_price,
                    ROUND(AVG(price_per_sqm), 2) AS avg_psm,
                    MIN(price) AS min_price,
                    MAX(price) AS max_price
                FROM LeaseCategories
                GROUP BY flat_type_name, lease_band
            )
            SELECT 
                la.flat_type_name,
                la.lease_band,
                la.transaction_count,
                la.avg_price,
                la.avg_psm,
                la.min_price,
                la.max_price,
                -- 🆕 Compare to the highest lease band within same flat type (benchmark)
                FIRST_VALUE(la.avg_price) OVER (
                    PARTITION BY la.flat_type_name 
                    ORDER BY la.lease_band DESC
                    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                ) AS price_at_90plus,
                ROUND(
                    ((la.avg_price - FIRST_VALUE(la.avg_price) OVER (
                        PARTITION BY la.flat_type_name 
                        ORDER BY la.lease_band DESC
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    )) / FIRST_VALUE(la.avg_price) OVER (
                        PARTITION BY la.flat_type_name 
                        ORDER BY la.lease_band DESC
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    )) * 100, 2
                ) AS depreciation_pct
            FROM LeaseAnalysis la
            ORDER BY la.flat_type_name, la.lease_band DESC
        `, params);
        
        res.json({
            success: true,
            count: depreciation.length,
            filters: {
                flatType
            },
            data: depreciation
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 🆕 NEW ENDPOINT: Get heatmap data for towns
 * GET /api/analytics/heatmap
 * Query params: flatType (optional), months (default: 12)
 * 
 * Returns town-by-town metrics with YoY growth for color-coding
 */
async function getHeatmapData(req, res, next) {
    try {
        const months = req.query.months ? parseInt(req.query.months) : 12;
        const flatType = req.query.flatType;
        
        let whereClause = '';
        const params = [months];
        
        if (flatType) {
            whereClause = 'AND ft.flat_type_name = ?';
            params.push(flatType);
        }
        
        const query = `
            WITH CurrentPeriod AS (
                -- Get recent data (last N months)
                SELECT 
                    town.town_name,
                    COUNT(*) AS transaction_count,
                    ROUND(AVG(t.price), 2) AS avg_price,
                    ROUND(AVG(t.price_per_sqm), 2) AS avg_price_per_sqm,
                    MAX(t.month) AS latest_month
                FROM Transaction t
                JOIN Block b ON t.block_id = b.block_id
                JOIN Town town ON b.town_id = town.town_id
                JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
                WHERE t.month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL ? MONTH), '%Y-%m')
                ${whereClause}
                GROUP BY town.town_name
            ),
            PreviousPeriod AS (
                -- Get comparison data (same period length, but 1 year ago)
                SELECT 
                    town.town_name,
                    ROUND(AVG(t.price), 2) AS prev_avg_price,
                    ROUND(AVG(t.price_per_sqm), 2) AS prev_avg_price_per_sqm
                FROM Transaction t
                JOIN Block b ON t.block_id = b.block_id
                JOIN Town town ON b.town_id = town.town_id
                JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
                WHERE t.month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL ? + 12 MONTH), '%Y-%m')
                    AND t.month < DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 MONTH), '%Y-%m')
                ${whereClause}
                GROUP BY town.town_name
            )
            SELECT 
                cp.town_name,
                cp.transaction_count,
                cp.avg_price,
                cp.avg_price_per_sqm,
                cp.latest_month,
                pp.prev_avg_price,
                -- Calculate year-over-year growth
                ROUND(
                    ((cp.avg_price - pp.prev_avg_price) / pp.prev_avg_price) * 100,
                    2
                ) AS yoy_growth_pct,
                ROUND(
                    ((cp.avg_price_per_sqm - pp.prev_avg_price_per_sqm) / pp.prev_avg_price_per_sqm) * 100,
                    2
                ) AS yoy_growth_psm_pct,
                -- Categorize growth for color mapping
                CASE 
                    WHEN ((cp.avg_price - pp.prev_avg_price) / pp.prev_avg_price) * 100 >= 10 THEN 'very_hot'
                    WHEN ((cp.avg_price - pp.prev_avg_price) / pp.prev_avg_price) * 100 >= 5 THEN 'hot'
                    WHEN ((cp.avg_price - pp.prev_avg_price) / pp.prev_avg_price) * 100 >= 2 THEN 'warm'
                    WHEN ((cp.avg_price - pp.prev_avg_price) / pp.prev_avg_price) * 100 >= 0 THEN 'neutral'
                    ELSE 'cool'
                END AS heat_category
            FROM CurrentPeriod cp
            LEFT JOIN PreviousPeriod pp ON cp.town_name = pp.town_name
            WHERE pp.prev_avg_price IS NOT NULL  -- Only include towns with comparison data
            ORDER BY yoy_growth_pct DESC
        `;
        
        params.push(months); // For the previous period calculation
        if (flatType) {
            params.push(flatType); // For the previous period WHERE clause
        }
        
        const [heatmapData] = await pool.query(query, params);
        
        res.json({
            success: true,
            count: heatmapData.length,
            filters: {
                months,
                flatType: flatType || 'All'
            },
            data: heatmapData
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
    getPriceDistribution,
    getPriceAvg,
    getTopAppreciatingTowns,      // 🆕 NEW EXPORT
    getLeaseDepreciation,          // 🆕 NEW EXPORT
    getHeatmapData                 // 🆕 NEW EXPORT
};