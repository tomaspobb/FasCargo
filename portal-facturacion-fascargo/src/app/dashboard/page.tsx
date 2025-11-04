'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ADMIN_EMAILS = ['topoblete@alumnos.uai.cl', 'fascargo.chile.spa@gmail.com'];

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = '/auth/login';
      return;
    }
    fetch(`/api/users?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.email) {
          setUserName(d.email.split('@')[0]);
          setIsAdmin(ADMIN_EMAILS.includes(d.email));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main
      className="min-vh-100"
      style={{
        background:
          'radial-gradient(1200px 500px at 50% -10%, rgba(37,99,235,.12), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%)',
      }}
    >
      <section className="container py-5">
        <header className="text-center mb-4">
          <h1 className="display-5 fw-bold">
            Bienvenido, <span className="text-primary">{userName}</span>
          </h1>
          <p className="text-muted lead">
            Visualiza, organiza y gestiona tus facturas desde un solo lugar.
          </p>
        </header>

        {/* CTA buttons (opcional, ya tienes los de la navbar; estos son “atajos”) */}
        <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
          <Link
            href="/facturas"
            className="btn btn-success rounded-4 px-4 py-3 d-flex align-items-center gap-2 fw-semibold"
          >
            <i className="bi bi-file-earmark-text"></i> Ver facturas
          </Link>
          <Link
            href="/facturas/gestion"
            className="btn btn-outline-primary rounded-4 px-4 py-3 d-flex align-items-center gap-2 fw-semibold"
          >
            <i className="bi bi-kanban"></i> Gestión de facturas
          </Link>
          {isAdmin && (
            <Link
              href="/users"
              className="btn btn-outline-secondary rounded-4 px-4 py-3 d-flex align-items-center gap-2 fw-semibold"
            >
              <i className="bi bi-shield-lock"></i> Gestión de dispositivos
            </Link>
          )}
        </div>

        {/* Feature cards */}
        <div className="row g-4 justify-content-center">
          {[
            {
              icon: 'bi-folder',
              title: 'Carpetas inteligentes',
              text: 'Agrupación automática por nombre para encontrar todo más rápido.',
            },
            {
              icon: 'bi-bar-chart-line',
              title: 'KPIs dinámicos',
              text: 'Neto, IVA y Total recalculados al instante por carpeta o selección.',
            },
            {
              icon: 'bi-lock',
              title: 'Control de acceso',
              text: 'Solo administradores gestionan dispositivos y acciones sensibles.',
            },
          ].map((c) => (
            <div key={c.title} className="col-12 col-md-4">
              <div className="card border-0 rounded-4 shadow-sm h-100">
                <div className="card-body p-4">
                  <i className={`bi ${c.icon} fs-3 text-primary mb-2`}></i>
                  <h5 className="fw-semibold">{c.title}</h5>
                  <p className="text-muted small m-0">{c.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
