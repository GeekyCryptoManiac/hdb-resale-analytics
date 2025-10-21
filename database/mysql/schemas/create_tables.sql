-- ============================================
-- TABLE CREATION SCRIPT
-- Create tables in dependency order
-- ============================================

USE hdb_analytics;

-- 1. TOWN TABLE
CREATE TABLE Town (
    town_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    town_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_town_name_not_empty CHECK (CHAR_LENGTH(TRIM(town_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. FLAT_TYPE TABLE
CREATE TABLE FlatType (
    flat_type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    flat_type_name VARCHAR(30) NOT NULL UNIQUE,
    typical_rooms INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_flat_type_name_not_empty CHECK (CHAR_LENGTH(TRIM(flat_type_name)) > 0),
    CONSTRAINT chk_typical_rooms_range CHECK (typical_rooms BETWEEN 1 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. FLAT_MODEL TABLE
CREATE TABLE FlatModel (
    flat_model_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    flat_model_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_flat_model_name_not_empty CHECK (CHAR_LENGTH(TRIM(flat_model_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. STOREY_RANGE TABLE
CREATE TABLE StoreyRange (
    storey_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `range` VARCHAR(10) NOT NULL UNIQUE,  -- Backticks!
    floor_min INT UNSIGNED,
    floor_max INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_range_format CHECK (`range` REGEXP '^[0-9]{2} TO [0-9]{2}$' OR `range` REGEXP '^[0-9]{2}$'),
    CONSTRAINT chk_floor_min_max CHECK (floor_max >= floor_min)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. LEASE TABLE
CREATE TABLE Lease (
    lease_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lease_commence_year YEAR NOT NULL,
    remaining_lease_years INT UNSIGNED,
    remaining_lease_months INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_lease_year_valid CHECK (lease_commence_year BETWEEN 1960 AND 2030),
    CONSTRAINT chk_remaining_lease CHECK (remaining_lease_years <= 99),
    CONSTRAINT chk_remaining_months CHECK (remaining_lease_months < 12),
    
    UNIQUE KEY uk_lease_details (lease_commence_year, remaining_lease_years, remaining_lease_months)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BLOCK TABLE
CREATE TABLE Block (
    block_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    block_number VARCHAR(10) NOT NULL,
    street_name VARCHAR(100) NOT NULL,
    town_id INT UNSIGNED NOT NULL,
    postal_code VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_block_town 
        FOREIGN KEY (town_id) REFERENCES Town(town_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    CONSTRAINT chk_block_number_not_empty CHECK (CHAR_LENGTH(TRIM(block_number)) > 0),
    CONSTRAINT chk_street_name_not_empty CHECK (CHAR_LENGTH(TRIM(street_name)) > 0),
    
    UNIQUE KEY uk_block_location (block_number, street_name, town_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TRANSACTION TABLE
CREATE TABLE Transaction (
    transaction_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(7) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    floor_area_sqm DECIMAL(6,2) NOT NULL,
    price_per_sqm DECIMAL(10,2) GENERATED ALWAYS AS (price / floor_area_sqm) STORED,
    
    block_id INT UNSIGNED NOT NULL,
    flat_type_id INT UNSIGNED NOT NULL,
    flat_model_id INT UNSIGNED NOT NULL,
    storey_id INT UNSIGNED NOT NULL,
    lease_id INT UNSIGNED NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_block 
        FOREIGN KEY (block_id) REFERENCES Block(block_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    CONSTRAINT fk_transaction_flat_type 
        FOREIGN KEY (flat_type_id) REFERENCES FlatType(flat_type_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    CONSTRAINT fk_transaction_flat_model 
        FOREIGN KEY (flat_model_id) REFERENCES FlatModel(flat_model_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    CONSTRAINT fk_transaction_storey 
        FOREIGN KEY (storey_id) REFERENCES StoreyRange(storey_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    CONSTRAINT fk_transaction_lease 
        FOREIGN KEY (lease_id) REFERENCES Lease(lease_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT chk_month_format CHECK (month REGEXP '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT chk_floor_area_positive CHECK (floor_area_sqm > 0),
    CONSTRAINT chk_floor_area_realistic CHECK (floor_area_sqm BETWEEN 30 AND 200),
    
    INDEX idx_month (month),
    INDEX idx_price (price),
    INDEX idx_price_per_sqm (price_per_sqm)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'All tables created successfully!' AS Status;
SHOW TABLES;