'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    // Si no hay sesión -> redirigir a login
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    // Usuario autenticado
    setIsAuth(true);

    // Verificar si el usuario es administrador
    fetch(`/api/users?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const adminEmails = [
          'topoblete@alumnos.uai.cl',
          'fascargo.chile.spa@gmail.com', // ✅ Nuevo correo admin
        ];

        if (adminEmails.includes(data?.email)) setIsAdmin(true);
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, [router]);

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
      <div
        className="text-center p-5 shadow-lg bg-white rounded-4"
        style={{ maxWidth: '820px', width: '100%' }}
      >
        <h1 className="fw-bold text-primary mb-3">Bienvenido a tu panel</h1>

        <p className="lead text-muted mb-4">
          Accediste correctamente con doble autenticación. Gestiona tus documentos y estados de facturas desde aquí.
        </p>

        {/* Acciones principales */}
        <div className="row g-3 justify-content-center">
          {/* Ver facturas */}
          <div className="col-sm-6 col-md-5">
            <Link
              href="/facturas"
              className="btn btn-success w-100 px-4 py-3 rounded-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-file-earmark-pdf"></i>
              Ver facturas en PDF
            </Link>
          </div>

          {/* Subir nueva factura */}
          {isAuth && (
            <div className="col-sm-6 col-md-5">
              <Link
                href="/facturas/subir"
                className="btn btn-outline-warning w-100 px-4 py-3 rounded-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
              >
                <i className="bi bi-upload"></i>
                Subir nueva factura en PDF
              </Link>
            </div>
          )}

          {/* Gestión de facturas */}
          {isAuth && (
            <div className="col-sm-6 col-md-5">
              <Link
                href="/facturas/gestion"
                className="btn btn-outline-primary w-100 px-4 py-3 rounded-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
              >
                <i className="bi bi-kanban"></i>
                Gestión de facturas
              </Link>
            </div>
          )}

          {/* Opciones solo para administradores */}
          {isAdmin && (
            <div className="col-sm-6 col-md-5">
              <Link
                href="/users"
                className="btn btn-outline-secondary w-100 px-4 py-3 rounded-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
              >
                <i className="bi bi-shield-lock-fill"></i>
                Gestionar dispositivos conectados
              </Link>
            </div>
          )}
        </div>

        {/* Tips / Atajos */}
        <div className="mt-4 text-muted small">
          <div>Tip: desde “Gestión de facturas” puedes editar estados y exportar a Excel.</div>
        </div>
      </div>
    </main>
  );
}
