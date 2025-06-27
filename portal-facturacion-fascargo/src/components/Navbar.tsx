// src/components/Navbar.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm py-3 px-4 border-bottom">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        {/* Logo y marca */}
        <Link href="/" className="text-decoration-none d-flex align-items-center">
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

        {/* Título centrado */}
        <h1 className="fs-4 fw-bold text-center text-primary m-0">
          Portal <span className="text-dark">Empresa</span>
        </h1>

        {/* Placeholder para simetría */}
        <div style={{ width: '150px' }} />
      </div>
    </nav>
  );
}
