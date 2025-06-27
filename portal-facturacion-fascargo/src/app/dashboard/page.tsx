'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      // Si no hay usuario autenticado, redirige al login
      window.location.href = '/login';
      return;
    }

    // Buscar si el usuario es admin para mostrar sección extra
    fetch(`/api/users?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data?.email === 'topoblete@alumnos.uai.cl') {
          setIsAdmin(true);
        }
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <h4 className="text-muted">Cargando panel...</h4>
      </main>
    );
  }

  return (
    <main className="container py-5 text-center">
      <h1 className="fw-bold mb-4 text-primary">Bienvenido a tu panel</h1>

      <div className="bg-white p-4 rounded shadow-sm mb-4">
        <p className="lead text-secondary mb-3">
          Accediste correctamente con doble autenticación. Ahora puedes navegar con seguridad.
        </p>

        <p className="text-muted">
          Desde este panel puedes gestionar tu sesión y tus accesos. Si eres administrador, puedes controlar los dispositivos registrados.
        </p>
      </div>

      {isAdmin && (
        <div className="mt-4">
          <Link
            href="/users"
            className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold"
          >
            Gestionar dispositivos conectados
          </Link>
        </div>
      )}
    </main>
  );
}
