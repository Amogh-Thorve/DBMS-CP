import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (roleUsername: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('stvams_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
      // Fallback default admin user
      setUser({ username: 'admin', role: 'ADMIN' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const login = async (username: string, password = 'password123') => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('stvams_token', res.access_token);
      setToken(res.access_token);
      await fetchProfile();
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (roleUsername: string) => {
    await login(roleUsername, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('stvams_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
