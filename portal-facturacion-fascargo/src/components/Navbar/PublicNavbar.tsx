'use client';

import Link from 'next/link';

export default function PublicNavbar() {
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

        {/* Espacio reservado (simetría) */}
        <div style={{ width: '140px' }} />
      </div>
    </nav>
  );
}
