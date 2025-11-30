# HDB Resale Analytics Database

MySQL • MongoDB • Dual-Database Design

This folder contains all database resources for the HDB Resale Analytics platform.
MySQL stores structured HDB resale transactions.
MongoDB stores user behaviour data such as profiles, comparison lists, and search history.

---

## Overview

### MySQL (Relational)

Used for:

* HDB resale transactions
* Flat types, towns, leases, floor areas
* Historical price data
* Structured analytics

### MongoDB (Non-Relational)

Used for:

* User accounts
* Comparison lists
* Search history
* Flexible behavioural data

---

## Folder Structure

```
database/
├── data/                  # CSV and raw data files
├── mysql/
│   ├── schema.sql         # MySQL schema
│   ├── queries/           # Testing and verification queries
│   └── init_master.sql    # Combined schema setup (if provided)
├── mongodb/
│   ├── schemas/           # User and behaviour schemas (if applicable)
│   └── examples/          # Sample documents
└── import.js              # Node script to import CSV into MySQL
```

---

## MySQL Setup

### 1. Create Database

```sql
CREATE DATABASE hdb_resale;
```

### 2. Apply Schema

Run the schema file inside MySQL Workbench:

```sql
SOURCE database/mysql/schema.sql;
```

### 3. Import Resale Data

Place the CSV file inside:

```
database/data/
```

Then run:

```bash
node import.js
```

The importer:

* Loads records in batches
* Validates and sanitizes transaction fields
* Tracks progress in the console

### 4. Verify Import

Run provided queries:

```bash
mysql -u root -p < database/mysql/queries/verify_import.sql
```

---

## MongoDB Setup

### 1. Create MongoDB Cluster

Use MongoDB Atlas (recommended).
Create a database named:

```
hdbUsers
```

### 2. Collections Created Automatically

Collections include:

* users
* comparisonList entries
* search history (if implemented)

Nothing needs to be manually created.
The backend auto-creates documents when users interact with the system.

---

## Data Requirements

### MySQL Transaction Data

Supported columns (based on 2017–2025 resale dataset):

* month
* town
* flat_type
* flat_model
* storey_range
* floor_area_sqm
* lease_commence_date
* remaining_lease
* resale_price

### MongoDB User Data

Objects stored include:

* name
* email
* password (hashed)
* comparisonList array
* timestamps

---

## Notes on the Dual-Database Design

MySQL is used for:

* Large structured datasets
* Queries with joins
* Historical analytics

MongoDB is used for:

* Fast writes
* Flexible schema
* User-centric operations

This separation improves:

* Query performance
* System scalability
* Schema evolution flexibility

---

## Troubleshooting

### MySQL Data Import Fails

* Check CSV path
* Ensure schema is created
* Verify MySQL service is running
* Confirm credentials match `.env` in backend

### MongoDB Connection Fails

* Allow IP access in Atlas
* Check connection string
* Test with MongoDB Compass

### CSV Errors

* Ensure UTF-8 encoding
* Ensure correct column order
* Remove invalid rows before import

---

## License

For academic use under SIT INF2003 project requirements.
