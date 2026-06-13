import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('doctor_hub_token');
    const savedUser = localStorage.getItem('doctor_hub_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('doctor_hub_token', res.token);
      localStorage.setItem('doctor_hub_user', JSON.stringify(res.user));
      
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('doctor_hub_token');
    localStorage.removeItem('doctor_hub_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const updateUserProfile = (updatedProfile) => {
    const updatedUser = { ...user, profile: updatedProfile };
    localStorage.setItem('doctor_hub_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const register = async (userData) => {
    return await api.post('/auth/register', userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, updateUserProfile }}>
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
