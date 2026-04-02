import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Product Manager' | 'Team Member';
  originalRole: 'Admin' | 'Product Manager' | 'Team Member';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  switchRole: (role: User['role']) => Promise<void>;
  requestRole: (role: User['role'], description: string) => Promise<void>;
  myPendingRequest: any;
  refreshRequestStatus: () => Promise<void>;
  dismissRequest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return localStorage.getItem('refreshToken');
  });
  const [myPendingRequest, setMyPendingRequest] = useState<any>(null);

  const login = (newToken: string, newRefreshToken: string, newUser: User) => {
    setToken(newToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const switchRole = async (newRole: User['role']) => {
    try {
      const { token: newToken, refreshToken: newRefreshToken, user: newUser } = await api.post('/api/auth/switch-role', { role: newRole }, token);
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (err) {
      console.error('Failed to switch role:', err);
      throw err;
    }
  };

  const requestRole = async (requestedRole: User['role'], description: string) => {
    try {
      await api.post('/api/auth/role-request', { requested_role: requestedRole, description }, token);
      await refreshRequestStatus();
    } catch (err) {
      console.error('Failed to request role:', err);
      throw err;
    }
  };

  const refreshRequestStatus = async () => {
    if (!token) return;
    try {
      const data = await api.get('/api/auth/role-requests/my', token);
      setMyPendingRequest(data);
    } catch (err) {
      console.error('Failed to fetch request status:', err);
    }
  };

  const dismissRequest = async () => {
    if (!token) return;
    try {
      await api.delete('/api/auth/role-requests/my', token);
      setMyPendingRequest(null);
    } catch (err) {
      console.error('Failed to dismiss request:', err);
    }
  };

  useEffect(() => {
    if (token) {
      refreshRequestStatus();
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout, switchRole, requestRole, myPendingRequest, refreshRequestStatus, dismissRequest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
