-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

USE hdb_analytics;

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

INSERT INTO StoreyRange (`range`, floor_min, floor_max) VALUES  -- Backticks!
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

SELECT 'Sample data inserted!' AS Status;
SELECT COUNT(*) AS total_transactions FROM Transaction;