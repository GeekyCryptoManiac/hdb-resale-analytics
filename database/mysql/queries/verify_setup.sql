-- ============================================
-- IMPORT VERIFICATION SCRIPT
-- Run this after importing data
-- ============================================

USE hdb_analytics;

SELECT '========================================' AS '';
SELECT 'DATA IMPORT VERIFICATION REPORT' AS '';
SELECT '========================================' AS '';
SELECT '' AS '';

-- 1. Record Counts
SELECT '1. RECORD COUNTS' AS '';
SELECT 'Town' AS table_name, COUNT(*) AS count FROM Town
UNION ALL SELECT 'FlatType', COUNT(*) FROM FlatType
UNION ALL SELECT 'FlatModel', COUNT(*) FROM FlatModel
UNION ALL SELECT 'StoreyRange', COUNT(*) FROM StoreyRange
UNION ALL SELECT 'Lease', COUNT(*) FROM Lease
UNION ALL SELECT 'Block', COUNT(*) FROM Block
UNION ALL SELECT 'Transaction', COUNT(*) FROM Transaction;

SELECT '' AS '';

-- 2. Price Statistics
SELECT '2. PRICE STATISTICS' AS '';
SELECT 
    COUNT(*) AS total_transactions,
    MIN(price) AS min_price,
    MAX(price) AS max_price,
    ROUND(AVG(price), 2) AS avg_price,
    ROUND(STDDEV(price), 2) AS stddev_price
FROM Transaction;

SELECT '' AS '';

-- 3. Top 5 Towns by Transaction Count
SELECT '3. TOP 5 TOWNS BY TRANSACTION COUNT' AS '';
SELECT 
    town.town_name,
    COUNT(*) AS transaction_count
FROM Transaction t
JOIN Block b ON t.block_id = b.block_id
JOIN Town town ON b.town_id = town.town_id
GROUP BY town.town_name
ORDER BY transaction_count DESC
LIMIT 5;

SELECT '' AS '';

-- 4. Flat Type Distribution
SELECT '4. FLAT TYPE DISTRIBUTION' AS '';
SELECT 
    ft.flat_type_name,
    COUNT(*) AS count,
    ROUND(AVG(t.price), 2) AS avg_price
FROM Transaction t
JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
GROUP BY ft.flat_type_name
ORDER BY count DESC;

SELECT '' AS '';

-- 5. Date Range
SELECT '5. DATE RANGE COVERAGE' AS '';
SELECT 
    MIN(month) AS earliest_transaction,
    MAX(month) AS latest_transaction,
    COUNT(DISTINCT month) AS total_months
FROM Transaction;

SELECT '' AS '';

-- 6. Sample Transactions
SELECT '6. SAMPLE TRANSACTIONS (Latest 5)' AS '';
SELECT 
    t.month,
    town.town_name,
    ft.flat_type_name,
    t.price,
    t.floor_area_sqm
FROM Transaction t
JOIN Block b ON t.block_id = b.block_id
JOIN Town town ON b.town_id = town.town_id
JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
ORDER BY t.month DESC, t.transaction_id DESC
LIMIT 5;

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT 'VERIFICATION COMPLETE!' AS '';
SELECT '========================================' AS '';