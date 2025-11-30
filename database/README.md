# HDB Resale Analytics Database

MySQL • MongoDB Atlas • Dual-Database Design

This folder contains all database resources for the HDB Resale Analytics platform.
MySQL stores structured HDB resale transactions.
MongoDB Atlas stores user behaviour data such as user profiles and comparison lists.

MongoDB Atlas is **already configured** and requires **no additional setup**.

---

## Overview

### MySQL (Relational)

Used for:

* HDB resale transactions
* Flat and town attributes
* Historical pricing analytics
* Joins and structured queries

### MongoDB Atlas (Non-Relational)

Used for:

* User accounts
* Comparison lists
* Behavioural data

MongoDB Atlas is **fully deployed** and connected to the backend via environment variables.

---

## Folder Structure

```
database/
├── mysql/
│   ├── schema.sql              # SQL schema for MySQL
│   ├── queries/                # Validation and test queries
│   └── init_master.sql         # Optional combined schema
```

---

## MySQL Setup

### 1. Create Database

```sql
CREATE DATABASE hdb_resale;
```

### 2. Apply Schema

Run the schema file:

```sql
SOURCE database/mysql/schema.sql;
```

### 3. Import HDB Resale Data

Place your CSV file into:

```
database/data/
```

Then run:

```bash
node import.js
```

The import script:

* Reads the CSV
* Inserts records in batches
* Shows progress in terminal

### 4. Validate Import

```bash
mysql -u root -p < database/mysql/queries/verify_import.sql
```

---

## MongoDB Atlas Setup

MongoDB Atlas is **already connected and configured**.

The backend automatically interacts with Atlas to manage:

* `users` collection
* `comparisonList` embedded documents
* Timestamps and updates

No local installation or manual setup is required.

---

## Data Requirements

### MySQL Data

Includes:

* month
* town
* flat_type
* flat_model
* floor_area_sqm
* remaining_lease
* resale_price

### MongoDB Atlas Data

Stored as flexible documents supporting:

* user profiles
* saved property comparisons
* behavioural metadata

---

## Dual-Database Design Notes

MySQL provides:

* Structured and historical data
* Strong relational consistency

MongoDB Atlas provides:

* Flexible schema
* Faster user-centric writes
* Cloud scalability

This combination supports performance and feature expansion.

---

## License

Academic use under SIT INF2003 project requirements.
