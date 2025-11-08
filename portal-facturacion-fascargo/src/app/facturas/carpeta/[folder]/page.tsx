// src/app/facturas/carpeta/[folder]/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Kpi from '@/components/Kpi';
import { CLP, InvoiceDTO, groupKey } from '@/lib/utils';

const monthToRange = (m: string) => {
  // m = 'YYYY-MM'
  const [y, mm] = m.split('-').map(Number);
  const start = new Date(y, mm - 1, 1, 0, 0, 0);
  const end = new Date(y, mm, 0, 23, 59, 59, 999); // último día del mes
  return { start, end };
};

function sum(arr: Array<number | null | undefined>): number {
  return arr.reduce<number>((acc, b) => acc + (b ?? 0), 0);
}

export default function FolderDetailPage() {
  const search = useSearchParams();
  const folderName = decodeURIComponent(search.get('name') || '');

  const [all, setAll] = useState<InvoiceDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] =
    useState<'Todas' | 'pagada' | 'pendiente' | 'anulada' | 'vencida'>('Todas');
  const [q, setQ] = useState('');
  const [sort, setSort] =
    useState<'fecha-desc' | 'fecha-asc' | 'monto-desc' | 'monto-asc'>('fecha-desc');

  // filtros de MES
  const [mFrom, setMFrom] = useState<string>(''); // 'YYYY-MM'
  const [mTo, setMTo] = useState<string>('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/pdf/all', { cache: 'no-store' });
      const data = await res.json();
      setAll(data || []);
    })();
  }, []);

  const items = useMemo(() => {
    let arr = all.filter((i) => groupKey(i) === folderName);

    // por estado
    if (status !== 'Todas') arr = arr.filter((i) => i.estadoPago === status);

    // por texto
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      arr = arr.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(term) ||
          (i.folio || '').toLowerCase().includes(term) ||
          (i.proveedor || '').toLowerCase().includes(term),
      );
    }

    // por mes
    if (mFrom) {
      const { start } = monthToRange(mFrom);
      arr = arr.filter((i) => +new Date(i.createdAt) >= +start);
    }
    if (mTo) {
      const { end } = monthToRange(mTo);
      arr = arr.filter((i) => +new Date(i.createdAt) <= +end);
    }

    // ordenar
    switch (sort) {
      case 'fecha-asc':
        arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case 'monto-desc':
        arr.sort((a, b) => (b.total || 0) - (a.total || 0));
        break;
      case 'monto-asc':
        arr.sort((a, b) => (a.total || 0) - (b.total || 0));
        break;
      default:
        arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    return arr;
  }, [all, folderName, status, q, sort, mFrom, mTo]);

  const selItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  // KPIs (si hay selección, usa selección)
  const base = selItems.length ? selItems : items;
  const kNeto = sum(base.map((i) => i.neto));
  const kIva = sum(base.map((i) => i.iva));
  const kTotal = sum(base.map((i) => i.total));

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const allChecked = items.length > 0 && selectedIds.size === items.length;
  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (items.length === prev.size) return new Set();
      return new Set(items.map((i) => i.id));
    });
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-folder fs-3 text-primary" />
          <h2 className="m-0 fw-bold text-primary">{folderName || 'Carpeta'}</h2>
        </div>
        <div className="d-flex gap-2">
          <Link href="/facturas" className="btn btn-outline-primary rounded-pill">
            ← Carpetas
          </Link>
          <Link href="/dashboard" className="btn btn-outline-secondary rounded-pill">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="row g-3 mb-3">
        <div className="col-sm-4"><Kpi label="Monto Neto" value={CLP(kNeto)} /></div>
        <div className="col-sm-4"><Kpi label="IVA" value={CLP(kIva)} /></div>
        <div className="col-sm-4"><Kpi label="Total" value={CLP(kTotal)} /></div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-4 shadow-sm p-3 mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label small">Estado</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="Todas">Todas</option>
              <option value="pagada">Pagadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="anulada">Anuladas</option>
              <option value="vencida">Vencidas</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label small">Ordenar</label>
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="fecha-desc">Más recientes primero</option>
              <option value="fecha-asc">Más antiguos primero</option>
              <option value="monto-desc">Monto mayor</option>
              <option value="monto-asc">Monto menor</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label small">Mes desde</label>
            <input type="month" className="form-control" value={mFrom} onChange={(e) => setMFrom(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small">Mes hasta</label>
            <input type="month" className="form-control" value={mTo} onChange={(e) => setMTo(e.target.value)} />
          </div>

          <div className="col-md-6">
            <label className="form-label small">Buscar (título, folio o proveedor)</label>
            <input
              className="form-control"
              placeholder="Ej: Transporte Leis, 1933…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="col-md-6 d-flex align-items-center gap-3">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="checkAll" checked={allChecked} onChange={toggleAll} />
              <label className="form-check-label" htmlFor="checkAll">
                Seleccionar todas ({items.length})
              </label>
            </div>
            {(mFrom || mTo || q || status !== 'Todas') && (
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill"
                onClick={() => { setMFrom(''); setMTo(''); setQ(''); setStatus('Todas'); }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="row g-4">
        {items.map((f) => {
          const checked = selectedIds.has(f.id);
          return (
            <div key={f.id} className="col-lg-6">
              <div className={`card border-0 rounded-4 shadow-sm ${checked ? 'border border-primary' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center gap-2">
                      <input type="checkbox" className="form-check-input" checked={checked} onChange={() => toggle(f.id)} />
                      <h5 className="card-title fw-semibold m-0">{f.title}</h5>
                    </div>
                    <span
                      className={`badge rounded-pill ${
                        f.estadoPago === 'pagada'
                          ? 'bg-success'
                          : f.estadoPago === 'pendiente'
                          ? 'bg-warning text-dark'
                          : f.estadoPago === 'vencida'
                          ? 'bg-danger'
                          : 'bg-secondary'
                      }`}
                    >
                      {f.estadoPago || '—'}
                    </span>
                  </div>

                  <div className="text-muted small mt-2">
                    <div><strong>Folio:</strong> {f.folio || '—'}</div>
                    <div><strong>Proveedor:</strong> {f.proveedor || '—'}</div>
                    <div><strong>Subida:</strong> {new Date(f.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="mt-2 small">
                    <span className="me-3"><strong>Neto:</strong> {CLP(f.neto)}</span>
                    <span className="me-3"><strong>IVA:</strong> {CLP(f.iva)}</span>
                    <span><strong>Total:</strong> {CLP(f.total)}</span>
                  </div>

                  <div className="mt-3">
                    <Link href={`/facturas/${f.id}`} className="btn btn-outline-primary rounded-pill">
                      Ver factura
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="col-12">
            <div className="alert alert-secondary">No hay facturas en esta carpeta con el filtro actual.</div>
          </div>
        )}
      </div>
    </div>
  );
}
