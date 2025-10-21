-- ============================================
-- INF2003 HDB Resale Price Analytics Platform
-- Database Initialization Script
-- Team 15
-- ============================================

DROP DATABASE IF EXISTS hdb_analytics;

CREATE DATABASE hdb_analytics 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE hdb_analytics;

SELECT 'Database hdb_analytics created successfully!' AS Status;