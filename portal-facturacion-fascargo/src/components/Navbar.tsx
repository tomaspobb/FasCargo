'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-bottom shadow-sm py-3 px-4">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logo + Marca FasCargo */}
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image
            src="/logo-fascargo.png"
            alt="FasCargo Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
          <span className="ms-2 fs-5 fw-semibold text-dark">
            FasCargo <span className="text-primary">Chile</span>
          </span>
        </Link>

        {/* Portal Empresa */}
        <span className="fs-5 fw-bold text-primary d-none d-md-block">
          Portal <span className="text-dark">Empresa</span>
        </span>

        {/* Botón de login */}
        <Link
          href="/login"
          className="btn btn-light border rounded-pill px-4 py-2 shadow-sm fw-medium"
          style={{ transition: 'all 0.2s ease-in-out' }}
        >
          Iniciar sesión
        </Link>
      </div>
    </nav>
  );
}
