'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

const ADMIN_EMAILS = ['topoblete@alumnos.uai.cl', 'fascargo.chile.spa@gmail.com'];

type UserApi = { email?: string | null };

export default function NavbarSelector() {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  const [email, setEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Usuario');
  const [isAdmin, setIsAdmin] = useState(false);

  // —— Cargar usuario (simple) ——
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const cachedEmail = localStorage.getItem('email');
    if (cachedEmail) {
      setEmail(cachedEmail);
      setUserName(cachedEmail.split('@')[0]);
      setIsAdmin(ADMIN_EMAILS.includes(cachedEmail));
      return;
    }
    if (!userId) return;

    fetch(`/api/users?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: UserApi | null) => {
        const em = d?.email ?? '';
        if (!em) return;
        setEmail(em);
        setUserName(em.split('@')[0]);
        setIsAdmin(ADMIN_EMAILS.includes(em));
        try {
          localStorage.setItem('email', em);
        } catch {}
      })
      .catch(() => {});
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('token');
      localStorage.removeItem('2faInProgress');
      localStorage.removeItem('sessionVerified');
      localStorage.removeItem('twoFA-verified');
    } catch {}
    window.location.href = '/auth/login';
  };

  // Navegación central (se oculta en dashboard)
  const centerLinks = useMemo(() => {
    const active = (href: string) =>
      (pathname.startsWith('/facturas/gestion') && href === '/facturas/gestion') ||
      (pathname.startsWith('/facturas') && !pathname.startsWith('/facturas/gestion') && href === '/facturas') ||
      (pathname.startsWith('/users') && href === '/users');

    const baseBtn = 'btn btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2';
    const Item = ({
      href,
      icon,
      label,
    }: {
      href: string;
      icon: string;
      label: string;
    }) => (
      <Link
        href={href}
        className={`${baseBtn} ${active(href) ? 'btn-primary' : 'btn-outline-secondary'}`}
        aria-current={active(href) ? 'page' : undefined}
        title={label}
      >
        <i className={`bi ${icon}`} />
        <span className="fw-semibold">{label}</span>
      </Link>
    );

    return (
      <div className="d-none d-lg-flex align-items-center gap-2 mx-auto">
        <Item href="/facturas" icon="bi-file-earmark-text" label="Facturas" />
        <Item href="/facturas/gestion" icon="bi-kanban" label="Gestión de facturas" />
        {isAdmin && <Item href="/users" icon="bi-shield-lock" label="Gestionar dispositivos" />}
      </div>
    );
  }, [pathname, isAdmin]);

  return (
    <nav className="navbar sticky-top bg-white shadow-sm" style={{ borderBottom: '1px solid #edf1f7' }}>
      <div className="container py-2 d-flex align-items-center justify-content-between">
        {/* Brand */}
        <Link href="/dashboard" className="navbar-brand fw-bold d-flex align-items-center gap-2">
          <span className="text-primary">FasCargo</span>
          <span className="text-dark">Chile</span>
        </Link>

        {/* Centro: ocultar en dashboard */}
        {!isDashboard && centerLinks}

        {/* Usuario + logout */}
        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary d-flex align-items-center gap-2 small">
            <i className="bi bi-person-circle fs-5 text-primary"></i>
            <span className="fw-semibold">{userName}</span>
          </span>
          <button
            className={`btn btn-danger ${isDashboard ? 'rounded-3 p-2' : 'rounded-pill px-3' } fw-semibold d-flex align-items-center gap-2`}
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <i className="bi bi-box-arrow-right"></i>
            {!isDashboard && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}
