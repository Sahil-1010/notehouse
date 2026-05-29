import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nh_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nh_token');
    if (token) {
      auth.me()
        .then(res => { setUser(res.data.user); localStorage.setItem('nh_user', JSON.stringify(res.data.user)); })
        .catch(() => { localStorage.removeItem('nh_token'); localStorage.removeItem('nh_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await auth.login({ username, password });
    const { token, user } = res.data;
    localStorage.setItem('nh_token', token);
    localStorage.setItem('nh_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (username, password) => {
    const res = await auth.register({ username, password });
    const { token, user } = res.data;
    localStorage.setItem('nh_token', token);
    localStorage.setItem('nh_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('nh_token');
    localStorage.removeItem('nh_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
