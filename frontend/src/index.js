// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './context/UserContext';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// TEMPORARY: Import API test (remove later)
import './services/apiTest';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
  
);

