'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PrivateNavbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const verified = localStorage.getItem('sessionVerified') === 'true';
    setIsLoggedIn(!!userId && verified);
  }, []);

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('token');
    localStorage.removeItem('2faInProgress');
    localStorage.removeItem('sessionVerified');
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm py-3 px-4 border-bottom">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        {/* Logo o marca a la izquierda */}
        <Link href="/" className="text-decoration-none">
          <span className="fs-5 fw-bold text-primary">FasCargo Chile</span>
        </Link>

        {/* Título centrado */}
        <h1 className="fs-4 fw-bold text-center text-primary m-0">
          Portal <span className="text-dark">Empresa</span>
        </h1>

        {/* Botón cerrar sesión (solo si hay sesión activa) */}
        {isLoggedIn ? (
          <button
            onClick={logout}
            className="btn btn-outline-danger rounded-pill px-3 fw-semibold"
          >
            Cerrar sesión
          </button>
        ) : (
          <div style={{ width: '140px' }} />
        )}
      </div>
    </nav>
  );
}
