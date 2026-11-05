"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface AuthUser {
  username: string; // always lowercase
  isAdmin: boolean;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, username: string, isAdmin: boolean) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

const STORAGE_KEY = "farewell_auth_session_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.username) {
          setUser({
            token: parsed.token,
            username: parsed.username.toLowerCase(),
            isAdmin: Boolean(parsed.isAdmin),
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse auth token", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token: string, username: string, isAdmin: boolean) => {
    const normalizedUsername = username.toLowerCase().trim();
    const newUser: AuthUser = {
      token,
      username: normalizedUsername,
      isAdmin,
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error("Failed to save auth to localStorage", e);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear auth from localStorage", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
