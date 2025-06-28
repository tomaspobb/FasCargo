'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PrivateNavbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Detectar sesión completamente verificada
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const verified = localStorage.getItem('sessionVerified') === 'true';
    setIsLoggedIn(!!userId && verified);
  }, []);

  // Cerrar sesión y limpiar todo
  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('token');
    localStorage.removeItem('2faInProgress');
    localStorage.removeItem('sessionVerified');

    // Redirigir al inicio y forzar recarga para refrescar navbar
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm py-3 px-4 border-bottom">
      <div className="container d-flex justify-content-between align-items-center">
        {/* Logo o nombre de la marca */}
        <Link href="/" className="text-decoration-none">
          <span className="fw-bold fs-4 text-primary">FasCargo</span>
        </Link>

        {/* Mostrar solo si hay sesión activa */}
        {isLoggedIn && (
          <button
            onClick={logout}
            className="btn btn-outline-danger rounded-pill px-4 fw-semibold"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </nav>
  );
}
