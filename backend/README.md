# HDB Resale Analytics Backend

Node.js • Express • MySQL • MongoDB

The backend powers the HDB Resale Analytics platform.
It handles authentication, search, user profile updates, and comparison lists.
It uses MySQL for structured resale data and MongoDB for user behaviour data.

---

## Features

### User and Authentication

* Register account
* Login using email and password
* JWT-based authentication
* Protected routes

### Property Search

* Filter by town, flat type, floor area, price
* Retrieve resale history
* Get transaction details from MySQL

### Comparison List (MongoDB)

* Add property to comparisonList
* Remove property
* Load saved items for the user

### User Profile

* Fetch user profile
* Update name or email

---

## Project Structure

```
backend/
├── controllers/
├── database/
│   ├── data/
│   ├── import.js
│   └── schema.sql
├── middleware/
├── models/
├── routes/
├── utils/
├── app.js
└── server.js
```

---

## Requirements

* Node.js 18 or newer
* MySQL Server
* MongoDB Atlas
* Git

---

## Installation

Clone the repository:

```
git clone https://github.com/GeekyCryptoManiac/hdb-resale-analytics.git
cd hdb-resale-analytics/backend
npm install
```

---

## Environment Setup

Create a `.env` file in the `backend` folder:

```
PORT=5000

# MongoDB
MONGO_URI=<your-mongodb-atlas-connection-string>

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=<your-password>
MYSQL_DATABASE=hdb_resale

# Authentication
JWT_SECRET=<your-secret-key>
```

---

## Running the Backend

### Development Mode

```
npm run dev
```

Starts the server with nodemon.
Reloads on code changes.

### Production Mode

```
npm start
```

Server runs on the port specified in `.env`.

---

## MySQL Setup

1. Create database:

```sql
CREATE DATABASE hdb_resale;
```

2. Apply schema from:

```
backend/database/schema.sql
```

3. Import resale CSV:

``` 
node database/import.js
```

This script loads transactions in batches and shows progress.

---

## MongoDB Setup

* Create a cluster on MongoDB Atlas
* Replace `<your-mongodb-atlas-connection-string>` in `.env`
* Collections are auto-created when the server runs

---

## Important Scripts

### Start server

``` 
npm start
```

### Development

``` 
npm run dev
```

### Import CSV

``` 
node database/import.js
```

---

## Troubleshooting

### MySQL Errors

* Confirm MySQL is running
* Check credentials in `.env`
* Ensure `schema.sql` is executed correctly

### MongoDB Errors

* Allow IP access in Atlas
* Use a valid MongoDB URI
* Test connection using MongoDB Compass

### Frontend Cannot Connect

* Ensure frontend `.env` has:

```
REACT_APP_API_BASE=http://localhost:5000
```

* Make sure backend is running
* Check CORS middleware in `app.js`

---

## License

This project is for academic use under the SIT INF2003 project requirements.

---

If you want, I can also create:
• A matching frontend README
• Full API documentation
• A Swagger/OpenAPI file for your backend
