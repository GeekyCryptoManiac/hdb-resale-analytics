// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparisonProperties, setComparisonProperties] = useState([]);

  // Load user and comparison properties from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedComparisonProperties = localStorage.getItem('comparisonProperties');
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }

    if (storedComparisonProperties) {
      try {
        setComparisonProperties(JSON.parse(storedComparisonProperties));
      } catch (error) {
        console.error('Error parsing stored comparison properties:', error);
        localStorage.removeItem('comparisonProperties');
      }
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setComparisonProperties([]);
    localStorage.removeItem('user');
    localStorage.removeItem('comparisonProperties');
  };

  // Update user data (e.g., when comparison list changes)
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Add property to comparison data
  const addToComparisonProperties = (property) => {
    setComparisonProperties(prev => {
      // Avoid duplicates
      const exists = prev.find(p => p.transactionId === property.transactionId);
      if (exists) return prev;
      
      const updated = [...prev, property];
      localStorage.setItem('comparisonProperties', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove property from comparison data
  const removeFromComparisonProperties = (transactionId) => {
    setComparisonProperties(prev => {
      const updated = prev.filter(prop => prop.transactionId !== transactionId);
      localStorage.setItem('comparisonProperties', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all comparison properties
  const clearComparisonProperties = () => {
    setComparisonProperties([]);
    localStorage.removeItem('comparisonProperties');
  };

  // Sync comparison properties with user's comparison list
  const syncComparisonProperties = (properties) => {
    setComparisonProperties(properties);
    localStorage.setItem('comparisonProperties', JSON.stringify(properties));
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    // Comparison properties functionality
    comparisonProperties,
    addToComparisonProperties,
    removeFromComparisonProperties,
    clearComparisonProperties,
    syncComparisonProperties
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

export default UserContext;