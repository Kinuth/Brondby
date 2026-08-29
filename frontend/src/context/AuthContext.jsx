import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brondby_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('brondby_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const savedToken = localStorage.getItem('brondby_access_token');
      if (savedToken) {
        try {
          const res = await apiClient.get('/auth/me/');
          setUser(res.data);
          localStorage.setItem('brondby_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to verify user session:', err);
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (username, password) => {
    const res = await apiClient.post('/auth/token/', { username, password });
    const { access, refresh, user: userData } = res.data;

    localStorage.setItem('brondby_access_token', access);
    localStorage.setItem('brondby_refresh_token', refresh);
    localStorage.setItem('brondby_user', JSON.stringify(userData));

    setToken(access);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('brondby_access_token');
    localStorage.removeItem('brondby_refresh_token');
    localStorage.removeItem('brondby_user');
    setToken(null);
    setUser(null);
  };

  const role = user?.role || 'worker';
  const isAdmin = role === 'admin' || user?.is_superuser;
  const isWorker = role === 'worker' && !isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isWorker,
        token,
        loading,
        login,
        logout,
        setUser,
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
