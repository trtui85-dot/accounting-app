import { createContext, useContext, useState, useEffect } from 'react';
import { get, post } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accounting_token');
    if (!token) { setLoading(false); return; }
    get('/auth/me').then(u => setUser(u)).catch(() => localStorage.removeItem('accounting_token')).finally(() => setLoading(false));
  }, []);

  const login = async (phone, pin) => {
    const res = await post('/auth/login', { phone, pin });
    localStorage.setItem('accounting_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => { localStorage.removeItem('accounting_token'); setUser(null); };

  if (loading) return <div className="app-loading"><div className="spinner" /></div>;

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
