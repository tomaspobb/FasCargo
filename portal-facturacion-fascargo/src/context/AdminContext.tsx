// src/context/AdminContext.tsx
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { isAdminEmail } from '@/lib/admin';
import { useAuth } from '@/context/AuthContext';

type AdminState = {
  email: string | null;
  isAdmin: boolean;
};

const AdminContext = createContext<AdminState>({ email: null, isAdmin: false });

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { email } = useAuth();

  const value = useMemo<AdminState>(() => {
    // Email desde AuthContext y fallback a localStorage
    let e = email ?? null;
    try {
      if (!e) {
        const stored = localStorage.getItem('email');
        if (stored) e = stored;
      }
    } catch {
      // ignore
    }
    const admin = isAdminEmail(e || undefined);
    return { email: e, isAdmin: admin };
  }, [email]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}
