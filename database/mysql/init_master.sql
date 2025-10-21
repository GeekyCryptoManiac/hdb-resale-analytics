-- ============================================
-- MASTER INITIALIZATION SCRIPT
-- All-in-one setup file
-- ============================================

-- ============================================
-- 1. CREATE DATABASE
-- ============================================

DROP DATABASE IF EXISTS hdb_analytics;

CREATE DATABASE hdb_analytics 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE hdb_analytics;

SELECT '1. Database created!' AS Status;

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- TOWN TABLE
CREATE TABLE Town (
    town_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    town_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_town_name_not_empty CHECK (CHAR_LENGTH(TRIM(town_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FLAT_TYPE TABLE
CREATE TABLE FlatType (
    flat_type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    flat_type_name VARCHAR(30) NOT NULL UNIQUE,
    typical_rooms INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_flat_type_name_not_empty CHECK (CHAR_LENGTH(TRIM(flat_type_name)) > 0),
    CONSTRAINT chk_typical_rooms_range CHECK (typical_rooms BETWEEN 1 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FLAT_MODEL TABLE
CREATE TABLE FlatModel (
    flat_model_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    flat_model_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_flat_model_name_not_empty CHECK (CHAR_LENGTH(TRIM(flat_model_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- STOREY_RANGE TABLE
CREATE TABLE StoreyRange (
    storey_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `range` VARCHAR(10) NOT NULL UNIQUE,  -- Backticks because 'range' is reserved
    floor_min INT UNSIGNED,
    floor_max INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_range_format CHECK (`range` REGEXP '^[0-9]{2} TO [0-9]{2}$' OR `range` REGEXP '^[0-9]{2}$'),
    CONSTRAINT chk_floor_min_max CHECK (floor_max >= floor_min)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LEASE TABLE
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

-- BLOCK TABLE
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

-- TRANSACTION TABLE
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

SELECT '2. All tables created!' AS Status;

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

CREATE INDEX idx_town_name ON Town(town_name);
CREATE INDEX idx_flat_type_name ON FlatType(flat_type_name);
CREATE INDEX idx_block_town ON Block(town_id);
CREATE INDEX idx_block_street ON Block(street_name);
CREATE INDEX idx_block_lookup ON Block(block_number, street_name);
CREATE INDEX idx_transaction_town_type ON Transaction(block_id, flat_type_id);
CREATE INDEX idx_transaction_date_range ON Transaction(month, price);
CREATE INDEX idx_transaction_area_price ON Transaction(floor_area_sqm, price);
CREATE INDEX idx_transaction_town_month ON Transaction(block_id, month);

SELECT '3. Indexes created!' AS Status;

-- ============================================
-- 4. INSERT SAMPLE DATA
-- ============================================

INSERT INTO Town (town_name) VALUES
('ANG MO KIO'), ('BEDOK'), ('BISHAN'), ('TAMPINES'), 
('WOODLANDS'), ('PUNGGOL'), ('SENGKANG'), ('JURONG WEST');

INSERT INTO FlatType (flat_type_name, typical_rooms) VALUES
('2 ROOM', 2), ('3 ROOM', 3), ('4 ROOM', 4), 
('5 ROOM', 5), ('EXECUTIVE', 6), ('MULTI-GENERATION', 6);

INSERT INTO FlatModel (flat_model_name, description) VALUES
('Improved', 'Standard improved layout'),
('New Generation', 'Modern design'),
('Model A', 'Traditional model A'),
('Premium Apartment', 'Premium finishes'),
('Simplified', 'Simplified layout'),
('DBSS', 'Design, Build and Sell Scheme');

INSERT INTO StoreyRange (`range`, floor_min, floor_max) VALUES  -- Added backticks
('01 TO 03', 1, 3), ('04 TO 06', 4, 6), ('07 TO 09', 7, 9),
('10 TO 12', 10, 12), ('13 TO 15', 13, 15), ('16 TO 18', 16, 18);

INSERT INTO Lease (lease_commence_year, remaining_lease_years, remaining_lease_months) VALUES
(1985, 60, 6), (1990, 65, 0), (1995, 70, 3), 
(2000, 75, 0), (2005, 80, 9), (2010, 85, 6);

INSERT INTO Block (block_number, street_name, town_id) VALUES
('301', 'Ang Mo Kio Avenue 1', 1),
('532', 'Bedok North Street 3', 2),
('210', 'Bishan Street 23', 3);

INSERT INTO Transaction (month, price, floor_area_sqm, block_id, flat_type_id, flat_model_id, storey_id, lease_id) VALUES
('2024-08', 445000.00, 95.00, 1, 4, 1, 4, 6),
('2024-07', 520000.00, 110.00, 2, 5, 2, 5, 5),
('2024-06', 380000.00, 85.00, 3, 3, 1, 3, 4);

SELECT '4. Sample data inserted!' AS Status;

-- ============================================
-- 5. VERIFICATION
-- ============================================

SELECT '5. Running verification...' AS Status;

SHOW TABLES;

SELECT 
    t.month,
    town.town_name,
    ft.flat_type_name,
    b.block_number,
    b.street_name,
    t.price,
    t.floor_area_sqm,
    t.price_per_sqm
FROM Transaction t
JOIN Block b ON t.block_id = b.block_id
JOIN Town town ON b.town_id = town.town_id
JOIN FlatType ft ON t.flat_type_id = ft.flat_type_id
JOIN StoreyRange sr ON t.storey_id = sr.storey_id
JOIN Lease l ON t.lease_id = l.lease_id
LIMIT 3;

-- ============================================
-- COMPLETE!
-- ============================================

SELECT '✓ Database setup complete!' AS Status;
SELECT 'You can now proceed to import the full HDB dataset' AS NextStep;