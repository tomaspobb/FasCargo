'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PrivateNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const verified = localStorage.getItem('sessionVerified') === 'true';
    setIsLoggedIn(!!userId && verified);
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('token');
      localStorage.removeItem('2faInProgress');
      localStorage.removeItem('sessionVerified');
    } catch {}
    window.location.href = '/auth';
  };

  return (
    <nav className="bg-white shadow-sm py-3 px-4 border-bottom">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <Link href="/" className="text-decoration-none">
          <span className="fs-5 fw-bold text-primary">FasCargo Chile</span>
        </Link>
        <h1 className="fs-4 fw-bold text-center text-primary m-0">
          Portal <span className="text-dark">Empresa</span>
        </h1>
        {isLoggedIn ? (
          <button onClick={logout} className="btn btn-outline-danger rounded-pill px-3 fw-semibold">
            Cerrar sesión
          </button>
        ) : (
          <div style={{ width: '140px' }} />
        )}
      </div>
    </nav>
  );
}
