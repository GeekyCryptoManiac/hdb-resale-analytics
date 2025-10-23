// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import pages
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ComparisonPage from './pages/ComparisonPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Import Navbar (we'll create this next)
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Default route - redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Main routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          
          {/* 404 - Page not found */}
          <Route path="*" element={
            <div className="container mt-5">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;