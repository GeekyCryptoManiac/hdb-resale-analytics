import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("token")); // 👈 sessionStorage

  useEffect(() => {
    if (token) {
      setUser(JSON.parse(sessionStorage.getItem("user"))); // 👈 sessionStorage
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

    setToken(data.token);
    setUser(data.user);
    sessionStorage.setItem("token", data.token);           // 👈 sessionStorage
    sessionStorage.setItem("user", JSON.stringify(data.user)); // 👈 sessionStorage
  };

  // Register new user
  const register = async (email, name, password) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password })
    });

    if (!res.ok) {
      throw new Error("Registration failed");
    }

    return await res.json();
  };

  // Logout clears everything
  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("token"); // 👈 sessionStorage
    sessionStorage.removeItem("user");  // 👈 sessionStorage
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
