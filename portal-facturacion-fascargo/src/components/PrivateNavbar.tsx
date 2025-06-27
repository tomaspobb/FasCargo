// src/components/PrivateNavbar.tsx
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PrivateNavbar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('userId');
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm py-3 px-4 border-bottom">
      <div className="container d-flex justify-content-between align-items-center">
        {/* Logo y marca */}
        <div className="d-flex align-items-center">
          <Image src="/logo-fascargo.png" alt="Logo FasCargo" width={40} height={40} className="me-2" />
          <span className="fw-bold fs-5 text-primary">FasCargo Chile</span>
        </div>

        {/* Botón logout */}
        <button onClick={logout} className="btn btn-outline-danger rounded-pill px-4">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
