'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      window.location.href = '/login';
      return;
    }

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
    <main className="container py-5">
      <h2 className="fw-bold text-primary mb-4">Bienvenido al panel de administración</h2>

      <div className="bg-white p-4 rounded shadow-sm text-center">
        <p className="mb-4 text-secondary">
          Desde aquí puedes gestionar el acceso y verificar los dispositivos autenticados.
        </p>

        {isAdmin && (
          <Link href="/users" className="btn btn-outline-primary px-4 py-2 rounded-pill">
            Gestionar dispositivos conectados
          </Link>
        )}
      </div>
    </main>
  );
}
