import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, LanguageCode } from '@shared/types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    language?: LanguageCode;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'medisaarthi_token';
const USER_KEY = 'medisaarthi_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session ONLY ONCE on mount
  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.data) {
          const userData = (res.data as any).user || res.data;
          setUser(userData);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
        } else {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, []); // Run only once on mount

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.data) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setIsLoading(false);
        return { success: true, user: newUser };
      } else {
        setIsLoading(false);
        return { success: false, error: res.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const signup = async (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    language?: LanguageCode;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(
        payload.name,
        payload.email,
        payload.password,
        payload.role,
        payload.language || 'en'
      );
      if (res.success && res.data) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setIsLoading(false);
        return { success: true, user: newUser };
      } else {
        setIsLoading(false);
        return { success: false, error: res.error || 'Registration failed' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network error during signup' };
    }
  };

  const logout = async () => {
    // Notify server asynchronously
    api.logout().catch(() => {});

    // Clear react state
    setToken(null);
    setUser(null);
    setIsLoading(false);

    // Clear persistent auth credentials
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore localStorage errors
    }

    // Clear pre-intake face scans and sensitive clinical drafts from sessionStorage
    try {
      sessionStorage.removeItem('medisaarthi_pre_intake_scan');
      sessionStorage.clear();
    } catch {
      // Ignore sessionStorage errors
    }

    // Dispatch global logout event so active views (intake, dashboards) instantly wipe their drafts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('medisaarthi:logout'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
