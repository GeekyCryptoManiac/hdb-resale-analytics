// src/context/AuthContext.js
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('👤 Loaded user from session:', userData);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          logout();
        }
      }
    }
  }, [token]);

  // Login with email + password
  const login = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    console.log('✅ Login successful, user data:', data.user);
    console.log('📋 User ID from backend:', data.user.id, data.user._id);
    
    // Ensure we have the user ID
    const userId = data.user._id || data.user.id;
    
    if (!userId) {
      console.error('❌ No user ID received from backend!', data.user);
      throw new Error('Invalid user data: Missing user ID');
    }
    
    // Store the user with proper ID field mapping
    const userWithId = {
      ...data.user,
      _id: userId,  // MongoDB uses _id
      id: userId,   // API returns id
      userId: userId, // Keep for compatibility
      comparisonList: data.user.comparisonList || []
    };

    console.log('💾 Storing user with ID:', userId);
    console.log('📦 Full user object:', userWithId);

    setToken(data.token);
    setUser(userWithId);
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(userWithId));
  };

  // Register new user
  const register = async (email, name, password) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Registration failed");
    }

    return await res.json();
  };

  // Update user comparison list
  const updateComparisonList = (comparisonList) => {
    console.log('📝 Updating comparison list:', comparisonList.length, 'items');
    const updatedUser = { ...user, comparisonList };
    setUser(updatedUser);
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Logout clears everything
  const logout = () => {
    console.log('👋 Logging out');
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login,
      setUser,
      register, 
      logout,
      updateComparisonList 
    }}>
      {children}
    </AuthContext.Provider>
  );
}