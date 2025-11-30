# HDB Resale Analytics Frontend

React.js • REST API • MySQL + MongoDB Integration

The frontend provides the user interface for the HDB Resale Analytics platform.
It communicates with the backend API to handle authentication, property search, user profiles, and comparison lists.

---

## Features

### Authentication

* Login and registration
* Form validation
* JWT stored in localStorage
* Auto-redirect for protected pages

### User Profile

* View profile details
* Update name or email
* Sync updated user data in real time

### Property Search

* Filter by town, flat type, floor area, and price
* Fetch results through backend API
* View transaction details

### Comparison List

* Add properties to user comparison list
* Remove items
* Data synced with MongoDB through backend

---

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── utils/
│   ├── App.js
│   ├── index.js
│   └── styles/
└── package.json
```

---

## Requirements

* Node.js 18 or newer
* NPM
* Backend server running
* Git

---

## Installation

Clone the repository and install dependencies:

``` 
git clone https://github.com/GeekyCryptoManiac/hdb-resale-analytics.git
cd hdb-resale-analytics/frontend
npm install
```

---

## Environment Setup

Create a `.env` file in the `frontend` folder:

```
REACT_APP_API_BASE=http://localhost:5000
```

This must match your backend server URL.

---

## Running the Frontend

### Development Mode

``` 
npm start
```

Runs the app at:

```
http://localhost:3000
```

Hot reload is enabled.
The browser refreshes automatically on changes.

### Production Build

``` 
npm run build
```

Creates an optimized production bundle in `/build`.

### Testing

``` 
npm test
```

Runs tests in watch mode.

---

## Connecting to the Backend

The frontend uses this environment variable:

```
REACT_APP_API_BASE=http://localhost:5000
```

The frontend communicates with backend routes such as:

```
/api/auth/login
/api/auth/register
/api/users/update
/api/properties/search
/api/properties/compare
```

If the backend is offline, the app will fail to load data.

---

## Troubleshooting

### Cannot Fetch Data

* Check the backend is running
* Confirm the `.env` API URL
* Check browser console for network errors

### CORS Issues

* Backend must allow frontend origin
* Restart backend after modifying CORS config

### Login Not Working

* Clear localStorage
* Ensure backend returns a valid JWT

### UI Not Updating

* Check React state management in AuthContext
* Ensure the backend returns updated user data after profile changes

---

## Deployment

You can deploy using:

* Netlify
* Vercel
* GitHub Pages
* Any static hosting provider

Make sure to set:

```
REACT_APP_API_BASE=<production-backend-url>
```

---

## License

This project is for academic use under SIT INF2003 project requirements.

---
