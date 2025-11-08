'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NavbarSelector from '@/components/Navbar/NavbarSelector';
import Footer from '@/components/Footer';

const AUTH_ROUTES = ['/auth', '/auth/login', '/auth/register'];
const PRIVATE_PREFIXES = ['/dashboard', '/facturas', '/users'];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isAuthRoute = useMemo(
    () => AUTH_ROUTES.some((p) => pathname === p || pathname?.startsWith(p)),
    [pathname]
  );
  const isPrivateRoute = useMemo(
    () => PRIVATE_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p)),
    [pathname]
  );

  useEffect(() => {
    // Route Guard en cliente con localStorage
    if (!isPrivateRoute) {
      setReady(true);
      return;
    }
    try {
      const userId = localStorage.getItem('userId');
      const verified = localStorage.getItem('sessionVerified') === 'true';
      if (!userId || !verified) {
        router.replace('/auth');
        return;
      }
    } catch {
      router.replace('/auth');
      return;
    }
    setReady(true);
  }, [isPrivateRoute, router]);

  if (!ready && isPrivateRoute) {
    // Loader simple mientras se verifica
    return (
      <div className="d-flex vh-100 vw-100 align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" aria-label="Cargando..." />
      </div>
    );
  }

  return (
    <>
      {/* Navbar/ Footer ocultos en páginas de auth */}
      {!isAuthRoute && <NavbarSelector />}
      <main className="flex-grow-1">{children}</main>
      {!isAuthRoute && <Footer />}
    </>
  );
}
