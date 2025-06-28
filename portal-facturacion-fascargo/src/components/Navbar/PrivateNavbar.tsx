// src/components/PrivateNavbar.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PrivateNavbar() {
  const router = useRouter();

  // Función para cerrar sesión
 const logout = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  localStorage.removeItem('token'); // por si acaso usas uno después
  router.push('/'); // Redirige siempre al home (page.tsx)
};

  return (
    <nav className="bg-white shadow-sm py-3 px-4 border-bottom">
      <div className="container d-flex justify-content-between align-items-center">
        {/* Marca - redirige al home */}
        <Link href="/" className="text-decoration-none">
          <span className="fw-bold fs-4 text-primary">FasCargo</span>
        </Link>

        {/* Botón cerrar sesión */}
        <button
          onClick={logout}
          className="btn btn-outline-danger rounded-pill px-4 fw-semibold"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
