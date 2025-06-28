// src/components/Navbar.tsx
'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm py-3 px-4 border-bottom">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        {/* Marca clickeable a Home */}
        <Link href="/" className="text-decoration-none">
          <span className="fs-5 fw-bold text-primary">FasCargo</span>
        </Link>

        {/* Título centrado */}
        <h1 className="fs-4 fw-bold text-center text-primary m-0">
          Portal <span className="text-dark">Empresa</span>
        </h1>

        {/* Placeholder para simetría visual */}
        <div style={{ width: '100px' }} />
      </div>
    </nav>
  );
}
