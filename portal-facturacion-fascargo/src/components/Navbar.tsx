'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm py-3">
      <div className="container-fluid px-4 d-flex justify-content-between align-items-center">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <Image
            src="/logo-fascargo.png"
            alt="Logo FasCargo"
            width={45}
            height={45}
            style={{ objectFit: 'contain' }}
          />
          <span className="fs-4 fw-bold text-primary">
            Portal <span className="text-dark">Facturación</span>
          </span>
        </Link>

        <div className="d-flex align-items-center gap-3">
          {/* Puedes reemplazar estos botones por íconos, links o menús */}
          <Link href="/contacto" className="btn btn-outline-secondary btn-sm">
            Soporte
          </Link>
          <Link href="/login" className="btn btn-outline-dark btn-sm">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}
