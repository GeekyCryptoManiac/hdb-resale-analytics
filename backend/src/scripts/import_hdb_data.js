// backend/scripts/import_hdb_data.js
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { pool, testConnection } = require('../config/database');
require('dotenv').config();

// Configuration
const DATA_FILE = process.env.DATA_FILE_PATH || path.join(__dirname, '../../../database/data/hdb_resale_data.csv');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 1000;

// In-memory caches for lookups
const caches = {
    towns: new Map(),
    flatTypes: new Map(),
    flatModels: new Map(),
    storeyRanges: new Map(),
    leases: new Map(),
    blocks: new Map()
};

// Statistics
const stats = {
    totalRows: 0,
    processed: 0,
    errors: 0,
    startTime: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function cleanString(str) {
    return str ? str.trim().toUpperCase() : null;
}

function parseRemainingLease(leaseStr) {
    // Parse "60 years 6 months" or "60 years" or "6 months"
    if (!leaseStr) return { years: 0, months: 0 };
    
    const yearMatch = leaseStr.match(/(\d+)\s*years?/i);
    const monthMatch = leaseStr.match(/(\d+)\s*months?/i);
    
    return {
        years: yearMatch ? parseInt(yearMatch[1]) : 0,
        months: monthMatch ? parseInt(monthMatch[1]) : 0
    };
}

function parseStoreyRange(rangeStr) {
    // Parse "10 TO 12" format
    if (!rangeStr) return { min: 0, max: 0 };
    
    const match = rangeStr.match(/(\d+)\s*TO\s*(\d+)/i);
    if (match) {
        return {
            min: parseInt(match[1]),
            max: parseInt(match[2])
        };
    }
    
    // Single number format
    const single = parseInt(rangeStr);
    if (!isNaN(single)) {
        return { min: single, max: single };
    }
    
    return { min: 0, max: 0 };
}

// ============================================
// DATABASE LOOKUP FUNCTIONS (with caching)
// ============================================

async function getOrCreateTown(townName) {
    const cleanName = cleanString(townName);
    
    // Check cache first
    if (caches.towns.has(cleanName)) {
        return caches.towns.get(cleanName);
    }
    
    try {
        // Try to find existing
        const [rows] = await pool.query(
            'SELECT town_id FROM Town WHERE town_name = ?',
            [cleanName]
        );
        
        if (rows.length > 0) {
            caches.towns.set(cleanName, rows[0].town_id);
            return rows[0].town_id;
        }
        
        // Create new
        const [result] = await pool.query(
            'INSERT INTO Town (town_name) VALUES (?)',
            [cleanName]
        );
        
        caches.towns.set(cleanName, result.insertId);
        return result.insertId;
    } catch (error) {
        console.error(`Error with town ${cleanName}:`, error.message);
        throw error;
    }
}

async function getOrCreateFlatType(flatTypeName) {
    const cleanName = cleanString(flatTypeName);
    
    if (caches.flatTypes.has(cleanName)) {
        return caches.flatTypes.get(cleanName);
    }
    
    try {
        const [rows] = await pool.query(
            'SELECT flat_type_id FROM FlatType WHERE flat_type_name = ?',
            [cleanName]
        );
        
        if (rows.length > 0) {
            caches.flatTypes.set(cleanName, rows[0].flat_type_id);
            return rows[0].flat_type_id;
        }
        
        // Extract typical rooms from name (e.g., "4 ROOM" -> 4)
        const roomMatch = cleanName.match(/(\d+)\s*ROOM/);
        const typicalRooms = roomMatch ? parseInt(roomMatch[1]) : null;
        
        const [result] = await pool.query(
            'INSERT INTO FlatType (flat_type_name, typical_rooms) VALUES (?, ?)',
            [cleanName, typicalRooms]
        );
        
        caches.flatTypes.set(cleanName, result.insertId);
        return result.insertId;
    } catch (error) {
        console.error(`Error with flat type ${cleanName}:`, error.message);
        throw error;
    }
}

async function getOrCreateFlatModel(flatModelName) {
    const cleanName = cleanString(flatModelName);
    
    if (caches.flatModels.has(cleanName)) {
        return caches.flatModels.get(cleanName);
    }
    
    try {
        const [rows] = await pool.query(
            'SELECT flat_model_id FROM FlatModel WHERE flat_model_name = ?',
            [cleanName]
        );
        
        if (rows.length > 0) {
            caches.flatModels.set(cleanName, rows[0].flat_model_id);
            return rows[0].flat_model_id;
        }
        
        const [result] = await pool.query(
            'INSERT INTO FlatModel (flat_model_name) VALUES (?)',
            [cleanName]
        );
        
        caches.flatModels.set(cleanName, result.insertId);
        return result.insertId;
    } catch (error) {
        console.error(`Error with flat model ${cleanName}:`, error.message);
        throw error;
    }
}

async function getOrCreateStoreyRange(rangeStr) {
    const cleanRange = cleanString(rangeStr);
    
    if (caches.storeyRanges.has(cleanRange)) {
        return caches.storeyRanges.get(cleanRange);
    }
    
    try {
        const [rows] = await pool.query(
            'SELECT storey_id FROM StoreyRange WHERE `range` = ?',
            [cleanRange]
        );
        
        if (rows.length > 0) {
            caches.storeyRanges.set(cleanRange, rows[0].storey_id);
            return rows[0].storey_id;
        }
        
        const { min, max } = parseStoreyRange(cleanRange);
        
        const [result] = await pool.query(
            'INSERT INTO StoreyRange (`range`, floor_min, floor_max) VALUES (?, ?, ?)',
            [cleanRange, min, max]
        );
        
        caches.storeyRanges.set(cleanRange, result.insertId);
        return result.insertId;
    } catch (error) {
        console.error(`Error with storey range ${cleanRange}:`, error.message);
        throw error;
    }
}

async function getOrCreateLease(leaseCommenceYear, remainingLeaseStr) {
    const { years, months } = parseRemainingLease(remainingLeaseStr);
    const leaseKey = `${leaseCommenceYear}-${years}-${months}`;
    
    if (caches.leases.has(leaseKey)) {
        return caches.leases.get(leaseKey);
    }
    
    try {
        const [rows] = await pool.query(
            'SELECT lease_id FROM Lease WHERE lease_commence_year = ? AND remaining_lease_years = ? AND remaining_lease_months = ?',
            [leaseCommenceYear, years, months]
        );
        
        if (rows.length > 0) {
            caches.leases.set(leaseKey, rows[0].lease_id);
            return rows[0].lease_id;
        }
        
        const [result] = await pool.query(
            'INSERT INTO Lease (lease_commence_year, remaining_lease_years, remaining_lease_months) VALUES (?, ?, ?)',
            [leaseCommenceYear, years, months]
        );
        
        caches.leases.set(leaseKey, result.insertId);
        return result.insertId;
    } catch (error) {
        console.error(`Error with lease ${leaseKey}:`, error.message);
        throw error;
    }
}

async function getOrCreateBlock(blockNumber, streetName, townId) {
    const cleanBlock = cleanString(blockNumber);
    const cleanStreet = cleanString(streetName);
    const blockKey = `${cleanBlock}-${cleanStreet}-${townId}`;
    
    if (caches.blocks.has(blockKey)) {
        return caches.blocks.get(blockKey);
    }
    
    try {
        const [rows] = await pool.query(
            'SELECT block_id FROM Block WHERE block_number = ? AND street_name = ? AND town_id = ?',
            [cleanBlock, cleanStreet, townId]
        );
        
        if (rows.length > 0) {
            caches.blocks.set(blockKey, rows[0].block_id);
            return rows[0].block_id;
        }
        
        const [result] = await pool.query(
            'INSERT INTO Block (block_number, street_name, town_id) VALUES (?, ?, ?)',
            [cleanBlock, cleanStreet, townId]
        );
        
        caches.blocks.set(blockKey, result.insertId);
        return result.insertId;
    } catch (error) {
        console.error(`Error with block ${blockKey}:`, error.message);
        throw error;
    }
}

// ============================================
// BATCH INSERT TRANSACTIONS
// ============================================

let transactionBatch = [];

async function insertTransaction(row) {
    try {
        // Get all foreign keys
        const townId = await getOrCreateTown(row.town);
        const flatTypeId = await getOrCreateFlatType(row.flat_type);
        const flatModelId = await getOrCreateFlatModel(row.flat_model);
        const storeyId = await getOrCreateStoreyRange(row.storey_range);
        const leaseId = await getOrCreateLease(row.lease_commence_date, row.remaining_lease);
        const blockId = await getOrCreateBlock(row.block, row.street_name, townId);
        
        // Add to batch
        transactionBatch.push([
            row.month,
            parseFloat(row.resale_price),
            parseFloat(row.floor_area_sqm),
            blockId,
            flatTypeId,
            flatModelId,
            storeyId,
            leaseId
        ]);
        
        // Insert batch when full
        if (transactionBatch.length >= BATCH_SIZE) {
            await flushTransactionBatch();
        }
        
    } catch (error) {
        stats.errors++;
        console.error(`Error processing row ${stats.processed}:`, error.message);
        console.error('Row data:', row);
    }
}

async function flushTransactionBatch() {
    if (transactionBatch.length === 0) return;
    
    try {
        const placeholders = transactionBatch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const values = transactionBatch.flat();
        
        await pool.query(
            `INSERT INTO Transaction (month, price, floor_area_sqm, block_id, flat_type_id, flat_model_id, storey_id, lease_id) 
             VALUES ${placeholders}`,
            values
        );
        
        console.log(`✓ Inserted batch of ${transactionBatch.length} transactions`);
        transactionBatch = [];
    } catch (error) {
        console.error('Error inserting batch:', error.message);
        stats.errors += transactionBatch.length;
        transactionBatch = [];
    }
}

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

async function importData() {
    console.log('==========================================');
    console.log('HDB Resale Data Import Script');
    console.log('==========================================\n');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
        console.error('Failed to connect to database. Exiting.');
        process.exit(1);
    }
    
    // Check if file exists
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`Error: Data file not found at ${DATA_FILE}`);
        console.error('Please download the HDB resale data CSV and place it in database/data/');
        process.exit(1);
    }
    
    console.log(`Reading data from: ${DATA_FILE}\n`);
    stats.startTime = Date.now();
    
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(DATA_FILE)
            .pipe(csv());
        
        stream.on('data', async (row) => {
            // PAUSE the stream while processing this row
            stream.pause();
            
            stats.totalRows++;
            
            try {
                // Process row
                await insertTransaction(row);
                stats.processed++;
                
                // Progress indicator every 1000 rows
                if (stats.processed % 1000 === 0) {
                    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
                    const rate = (stats.processed / elapsed).toFixed(0);
                    console.log(`Progress: ${stats.processed.toLocaleString()} rows | ${rate} rows/sec | Errors: ${stats.errors}`);
                }
            } catch (error) {
                stats.errors++;
                console.error(`Error on row ${stats.processed}:`, error.message);
            }
            
            // RESUME the stream to get next row
            stream.resume();
        });
        
        stream.on('end', async () => {
            // Now it's safe to flush and close
            await flushTransactionBatch();
            
            const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
            
            console.log('\n==========================================');
            console.log('Import Complete!');
            console.log('==========================================');
            console.log(`Total rows processed: ${stats.processed.toLocaleString()}`);
            console.log(`Errors: ${stats.errors}`);
            console.log(`Time elapsed: ${elapsed}s`);
            console.log(`Average rate: ${(stats.processed / elapsed).toFixed(0)} rows/sec`);
            console.log('\nCache statistics:');
            console.log(`  Towns: ${caches.towns.size}`);
            console.log(`  Flat Types: ${caches.flatTypes.size}`);
            console.log(`  Flat Models: ${caches.flatModels.size}`);
            console.log(`  Storey Ranges: ${caches.storeyRanges.size}`);
            console.log(`  Leases: ${caches.leases.size}`);
            console.log(`  Blocks: ${caches.blocks.size}`);
            
            await pool.end();
            resolve();
        });
        
        stream.on('error', (error) => {
            console.error('Error reading CSV:', error);
            reject(error);
        });
    });
}

// ============================================
// RUN IMPORT
// ============================================

importData()
    .then(() => {
        console.log('\n✓ Import script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Import script failed:', error);
        process.exit(1);
    });
