'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verifica si el usuario está logueado y si es admin
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
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
    <main
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '85vh', backgroundColor: '#f8f9fa' }}
    >
      <div className="text-center p-5 shadow-lg bg-white rounded-4" style={{ maxWidth: '720px' }}>
        <h1 className="fw-bold text-primary mb-3">Bienvenido a tu panel</h1>

        <p className="lead text-muted mb-4">
          Accediste correctamente con doble autenticación. Ya puedes gestionar tu sesión y acceder a tus documentos.
        </p>

        {/* Botón para ver facturas en PDF */}
        <div className="mb-3">
          <Link
            href="/facturas"
            className="btn btn-success px-4 py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
          >
            <i className="bi bi-file-earmark-pdf"></i>
            Ver facturas en PDF
          </Link>
        </div>

        {/* Solo para admin */}
      {isAdmin && (
        <>
          <div className="mb-3">
            <Link
              href="/facturas/subir"
              className="btn btn-outline-warning px-4 py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-upload"></i>
              Subir nueva factura en PDF
            </Link>
          </div>

          <div>
            <Link
              href="/users"
              className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-shield-lock-fill"></i>
              Gestionar dispositivos conectados
            </Link>
          </div>
        </>
      )}
      </div>
    </main>
  );
}
