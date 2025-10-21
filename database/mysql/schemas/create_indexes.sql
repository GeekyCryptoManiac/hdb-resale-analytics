-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

USE hdb_analytics;

CREATE INDEX idx_town_name ON Town(town_name);
CREATE INDEX idx_flat_type_name ON FlatType(flat_type_name);
CREATE INDEX idx_block_town ON Block(town_id);
CREATE INDEX idx_block_street ON Block(street_name);
CREATE INDEX idx_block_lookup ON Block(block_number, street_name);
CREATE INDEX idx_transaction_town_type ON Transaction(block_id, flat_type_id);
CREATE INDEX idx_transaction_date_range ON Transaction(month, price);
CREATE INDEX idx_transaction_area_price ON Transaction(floor_area_sqm, price);
CREATE INDEX idx_transaction_town_month ON Transaction(block_id, month);

SELECT 'Indexes created successfully!' AS Status;