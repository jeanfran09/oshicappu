"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  username: string;
  displayName: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("oshicappu_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsHydrated(true);
  }, []);

  const login = (username: string, password: string): boolean => {
    // Simple demo auth — accept any non-empty credentials
    if (username.trim() && password.trim()) {
      const newUser: User = {
        username: username.trim(),
        displayName: username.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username.trim()}`,
      };
      setUser(newUser);
      localStorage.setItem("oshicappu_user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("oshicappu_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {isHydrated ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
