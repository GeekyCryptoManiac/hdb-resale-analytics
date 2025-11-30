# HDB Resale Price Analytics Platform

INF2003 Database Systems Group Project - Team 15

## Team Members
- Ngo Cheng En Owen
- Muhammad Daffa Ramadhan
- Mohammed Shaqeel Bin Mohammed Sidek
- Alyssa Yu
- Tan Guan Teng
- Beatrice Tan Jie Ting

## Project Overview
A dual-database application for analyzing HDB resale prices in Singapore, demonstrating both relational (MySQL) and non-relational (MongoDB) database implementations.

### Tech Stack
- **Frontend:** React.js
- **Backend:** Express.js (Node.js)
- **Databases:** MySQL 8.0+, MongoDB
- **Data:** 200,000+ HDB resale transactions (2017-2025)

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- MongoDB (coming soon)

### Database Setup

1. **Install MySQL** (if not already installed):
```bash
   brew install mysql
   brew services start mysql
```

2. **Create the database and tables:**
```bash
   mysql -u root -p
   SOURCE database/mysql/init_master.sql;
   exit;
```

3. **Download HDB Data:**
   - Go to: https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view
   - Download the CSV file
   - Save as: `database/data/hdb_resale_data.csv`

4. **Configure environment:**
```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your MySQL password
```

5. **Install dependencies:**
```bash
   npm install
```

6. **Import HDB data:**
```bash
   node scripts/import_hdb_data.js
```
   This will take ~10-15 minutes and import 200,000+ transactions.

7. **Verify import:**
```bash
   mysql -u root -p < database/mysql/queries/verify_import.sql
```

## Database Schema

### MySQL (Relational)
- **7 normalized tables:** Town, Block, FlatType, FlatModel, StoreyRange, Lease, Transaction
- **200,000+ transactions** with full referential integrity
- **Complex relationships:** Many-to-one, enforced foreign keys

### MongoDB (NoSQL) - Coming Soon
- User profiles and preferences
- Search history
- Flexible schema for behavioral data

## Project Structure
```
hdb-resale-analytics/
├── backend/              # Express.js API
│   ├── config/          # Database connections
│   └── scripts/         # Data import scripts
├── database/
│   ├── mysql/           # SQL schemas and scripts
│   └── mongodb/         # MongoDB schemas (TBD)
├── frontend/            # React.js UI (TBD)
└── docs/                # Project documentation
```

## Current Status
- ✅ MySQL database schema complete
- ✅ Data import script complete
- ✅ 200k+ HDB transactions imported
- 🔄 Backend API (in progress)
- 🔄 Frontend UI (in progress)
- ⏳ MongoDB setup (pending)

## License
Academic project for SIT INF2003
