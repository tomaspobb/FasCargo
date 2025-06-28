'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('email');

    if (storedId) setUserId(storedId);
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const logout = () => {
    localStorage.clear();
    setUserId(null);
    setEmail(null);
    window.location.href = '/auth/login';
  };

  const value = {
    userId,
    email,
    isAuthenticated: !!userId,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
