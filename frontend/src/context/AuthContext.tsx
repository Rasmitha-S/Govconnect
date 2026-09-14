import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { authApi } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<User | null>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  switchDemoRole: (role: 'CITIZEN' | 'WATER_OFFICER' | 'REVENUE_OFFICER' | 'EDUCATION_OFFICER' | 'ADMIN') => Promise<void>;
  isAuthenticated: boolean;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('govconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('govconnect_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('govconnect_token');
      if (savedToken) {
        try {
          const res = await authApi.me();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('govconnect_user', JSON.stringify(res.data));
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('govconnect_token');
          localStorage.removeItem('govconnect_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: any): Promise<User | null> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('govconnect_token', res.data.token);
        localStorage.setItem('govconnect_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    return await authApi.register(data);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('govconnect_token');
    localStorage.removeItem('govconnect_user');
    setUser(null);
    setToken(null);
  };

  const switchDemoRole = async (targetRole: 'CITIZEN' | 'WATER_OFFICER' | 'REVENUE_OFFICER' | 'EDUCATION_OFFICER' | 'ADMIN') => {
    const emailMap = {
      CITIZEN: 'citizen@govconnect.demo',
      WATER_OFFICER: 'water.officer@govconnect.demo',
      REVENUE_OFFICER: 'revenue.officer@govconnect.demo',
      EDUCATION_OFFICER: 'education.officer@govconnect.demo',
      ADMIN: 'admin@govconnect.demo',
    };

    const email = emailMap[targetRole];
    await login({ email, password: 'Password@123' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
