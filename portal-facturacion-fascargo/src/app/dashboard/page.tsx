// src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/admin'; // ⬅️ se usa para detectar admin

type Invoice = {
  id: string;
  title: string;
  createdAt: string;
  estadoPago: 'pagada' | 'pendiente' | 'anulada' | 'vencida';
  total: number | null;
  proveedor?: string | null;
  folio?: string | null;
};

const CLP = (n: number) =>
  'CLP ' + (n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 });

const nameFromEmail = (email?: string | null) => {
  if (!email) return 'Usuario';
  const base = email.split('@')[0] || 'Usuario';
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export default function DashboardPage() {
  const { email } = useAuth();
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Nombre dinámico del usuario (AuthContext + fallback localStorage)
  const userName = useMemo(() => {
    if (email) return nameFromEmail(email);
    try {
      const e = localStorage.getItem('email');
      return nameFromEmail(e);
    } catch {
      return 'Usuario';
    }
  }, [email]);

  // Flag admin con fallback a localStorage
  const isAdmin = useMemo(() => {
    if (email) return isAdminEmail(email);
    try {
      const e = localStorage.getItem('email');
      return isAdminEmail(e);
    } catch {
      return false;
    }
  }, [email]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pdf/all', { cache: 'no-store' });
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpi = useMemo(() => {
    const totalDocs = items.length;
    const totalMonto = items.reduce(
      (a, it) => a + (typeof it.total === 'number' ? it.total : 0),
      0
    );
    const pagadas = items.filter((d) => d.estadoPago === 'pagada').length;
    const pendientes = items.filter((d) => d.estadoPago === 'pendiente').length;
    const vencidas = items.filter((d) => d.estadoPago === 'vencida').length;
    return { totalDocs, totalMonto, pagadas, pendientes, vencidas };
  }, [items]);

  const topProveedores = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      const p = (it.proveedor || '—').trim();
      map.set(p, (map.get(p) || 0) + (typeof it.total === 'number' ? it.total : 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [items]);

  // ⬇️ NUEVO: clase de columna responsiva según sea admin (3 tarjetas) o no (2 tarjetas mitad/mitad)
  const cardColClass = isAdmin ? 'col-12 col-lg-4' : 'col-12 col-lg-6';

  return (
    <div className="container py-4">
      {/* Hero */}
      <section className="rounded-4 bg-dashboard-hero p-4 p-md-5 mb-4 text-center shadow-sm">
        <h1 className="display-6 fw-bold mb-2">
          Bienvenido, <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-muted m-0">
          Visualiza, organiza y gestiona tus facturas desde un solo lugar.
        </p>
      </section>

      {/* KPIs */}
      <section className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card py-4">
            <div className="text-muted small">Facturas</div>
            <div className="fs-2 fw-bold">{kpi.totalDocs}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card py-4">
            <div className="text-muted small">Monto total</div>
            <div className="fs-4 fw-bold">{CLP(kpi.totalMonto)}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card py-4">
            <div className="text-muted small">Pagadas</div>
            <div className="fs-3 fw-bold text-success">{kpi.pagadas}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card py-4">
            <div className="text-muted small">Pendientes</div>
            <div className="fs-3 fw-bold text-warning">{kpi.pendientes}</div>
          </div>
        </div>
      </section>

      {/* Tarjetas funcionales */}
      <section className="row g-3 mb-4">
        <div className={cardColClass}>
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-folder2 fs-4 text-primary"></i>
                <h5 className="m-0">Carpetas inteligentes</h5>
              </div>
              <p className="text-muted small mb-3">
                Agrupación automática por nombre para encontrar todo más rápido.
              </p>
              <Link href="/facturas" className="btn btn-primary btn-sm rounded-pill">
                Abrir facturas
              </Link>
            </div>
          </div>
        </div>

        <div className={cardColClass}>
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-graph-up fs-4 text-success"></i>
                <h5 className="m-0">KPIs dinámicos</h5>
              </div>
              <p className="text-muted small mb-3">
                Recalcula Neto, IVA y Total al instante por carpeta o selección.
              </p>
              <Link
                href="/facturas/gestion"
                className="btn btn-outline-success btn-sm rounded-pill"
              >
                Ir a gestión
              </Link>
            </div>
          </div>
        </div>

        {/* Solo admins ven esta tercera tarjeta */}
        {isAdmin && (
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-shield-lock fs-4 text-secondary"></i>
                  <h5 className="m-0">Gestión de dispositivos</h5>
                </div>
                <p className="text-muted small mb-3">
                  Solo administradores gestionan dispositivos y acciones sensibles.
                </p>
                <Link href="/users" className="btn btn-outline-secondary btn-sm rounded-pill">
                  Gestionar dispositivos
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Top Proveedores */}
      <section className="card border-0 shadow-sm rounded-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-award fs-4 text-warning"></i>
            <h5 className="m-0">Top proveedores (actual)</h5>
          </div>

          {loading && <div className="text-muted small">Cargando…</div>}
          {err && <div className="text-danger small">{err}</div>}

          {!loading && !err && (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th className="text-end">Suma Total (CLP)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProveedores.map(([prov, total]) => (
                    <tr key={prov}>
                      <td
                        className="text-truncate"
                        style={{ maxWidth: 560 }}
                        title={prov}
                      >
                        {prov}
                      </td>
                      <td className="text-end fw-semibold">{CLP(total)}</td>
                    </tr>
                  ))}
                  {topProveedores.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center text-muted py-3">
                        Sin datos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
