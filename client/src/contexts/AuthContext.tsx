
import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    
    if (storedToken) {
      setToken(storedToken);
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Token validation failed');
          }
          return res.json();
        })
        .then((data) => {
          if (data.id) {
            setUser(data);
            // Update localStorage with fresh user data
            localStorage.setItem("auth_user", JSON.stringify(data));
            localStorage.setItem("auth_token", storedToken);
            // Remove old token key if exists
            localStorage.removeItem("token");
          } else {
            throw new Error('Invalid user data');
          }
        })
        .catch((error) => {
          console.log('Token validation failed:', error);
          // Clear all auth data
          localStorage.removeItem("token");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Try to load user from localStorage if token is missing but user exists
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.id) {
            // User data exists but no token, clear everything
            localStorage.removeItem("auth_user");
          }
        } catch (e) {
          localStorage.removeItem("auth_user");
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message || "Credenciales inválidas" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Error de conexión" };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: "Error de conexión" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    // Clear cart on logout for security
    localStorage.removeItem("cart_items");
  };

  const updateProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
