'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const ADMIN_EMAILS = ['topoblete@alumnos.uai.cl', 'fascargo.chile.spa@gmail.com'];

export default function NavbarSelector() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string>('Usuario');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    fetch(`/api/users?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.email) return;
        setUserName(d.email.split('@')[0]);
        setIsAdmin(ADMIN_EMAILS.includes(d.email));
      })
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem('userId');
    window.location.href = '/auth/login';
  };

  const isDashboard = pathname === '/dashboard';

  const NavItem = ({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: string;
    label: string;
  }) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`btn ${active ? 'btn-primary' : 'btn-outline-secondary'} ${
          isDashboard ? 'rounded-3 p-2' : 'rounded-pill px-3 py-2'
        } d-flex align-items-center gap-2`}
        title={label}
        aria-label={label}
      >
        <i className={`bi ${icon} ${isDashboard ? 'fs-5' : ''}`}></i>
        {!isDashboard && <span className="fw-semibold">{label}</span>}
      </Link>
    );
  };

  return (
    <nav
      className="navbar sticky-top bg-white shadow-sm"
      style={{ borderBottom: '1px solid #edf1f7' }}
    >
      <div className="container py-2 d-flex align-items-center justify-content-between">
        {/* Brand */}
        <Link href="/dashboard" className="navbar-brand fw-bold d-flex align-items-center gap-2">
          <span className="text-primary">FasCargo</span>
          <span className="text-dark">Chile</span>
        </Link>

        {/* Center menu */}
        <div className="d-flex align-items-center gap-2">
          <NavItem href="/facturas" icon="bi-file-earmark-text" label="Facturas" />
          <NavItem href="/facturas/gestion" icon="bi-kanban" label="Gestión de facturas" />
          {isAdmin && <NavItem href="/users" icon="bi-shield-lock" label="Gestionar dispositivos" />}
        </div>

        {/* Right side: user + logout */}
        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary d-flex align-items-center gap-2">
            <i className="bi bi-person-circle fs-5 text-primary"></i>
            <span className="fw-semibold">{userName}</span>
          </span>

          <button
            className="btn btn-danger rounded-3 px-3 fw-semibold d-flex align-items-center gap-2"
            onClick={logout}
            title="Cerrar sesión"
          >
            <i className="bi bi-box-arrow-right"></i>
            {!isDashboard && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}
