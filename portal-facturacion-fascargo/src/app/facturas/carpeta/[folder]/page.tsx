// src/app/facturas/carpeta/[folder]/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Kpi from '@/components/Kpi';
import { CLP, InvoiceDTO, groupKey } from '@/lib/utils';

// ---- Tipos locales para compatibilizar con InvoiceDTO ----
type Moneyish = {
  neto?: number | null;
  iva?: number | null;
  total?: number | null;
  folio?: string | null;
  proveedor?: string | null;
  estadoPago?: 'pagada' | 'pendiente' | 'anulada' | 'vencida' | string;
};

const asMoneyish = (x: InvoiceDTO): InvoiceDTO & Moneyish => x as any;

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

    if (status !== 'Todas') arr = arr.filter((i) => asMoneyish(i).estadoPago === status);

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      arr = arr.filter((i) => {
        const ii = asMoneyish(i);
        return (
          (ii.title || '').toLowerCase().includes(term) ||
          (ii.folio || '').toLowerCase().includes(term) ||
          (ii.proveedor || '').toLowerCase().includes(term)
        );
      });
    }

    if (mFrom) {
      const { start } = monthToRange(mFrom);
      arr = arr.filter((i) => +new Date(i.createdAt) >= +start);
    }
    if (mTo) {
      const { end } = monthToRange(mTo);
      arr = arr.filter((i) => +new Date(i.createdAt) <= +end);
    }

    switch (sort) {
      case 'fecha-asc':
        arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case 'monto-desc':
        arr.sort((a, b) => (asMoneyish(b).total || 0) - (asMoneyish(a).total || 0));
        break;
      case 'monto-asc':
        arr.sort((a, b) => (asMoneyish(a).total || 0) - (asMoneyish(b).total || 0));
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
  const kNeto  = sum(base.map((i) => asMoneyish(i).neto));
  const kIva   = sum(base.map((i) => asMoneyish(i).iva));
  const kTotal = sum(base.map((i) => asMoneyish(i).total));

  const allChecked = items.length > 0 && selectedIds.size === items.length;
  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (items.length === prev.size) return new Set();
      return new Set(items.map((i) => i.id));
    });
  };

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  // -------- Exportar a Excel (.xlsx) --------
  const exportXlsx = async (onlySelection = false) => {
    const rows = (onlySelection && selItems.length ? selItems : items).map((r) => {
      const rr = asMoneyish(r);
      return {
        Título: rr.title ?? '',
        Carpeta: groupKey(rr),
        Folio: rr.folio ?? '',
        Proveedor: rr.proveedor ?? '',
        Estado: rr.estadoPago ?? '',
        Neto: rr.neto ?? null,
        IVA: rr.iva ?? null,
        Total: rr.total ?? null,
        Subida: new Date(rr.createdAt).toLocaleString(),
        SubidaISO: rr.createdAt,
      };
    });

    const XLSX = await import('xlsx'); // carga dinámica para cliente
    const ws = XLSX.utils.json_to_sheet(rows);

    // auto-width por columna
    const keys = Object.keys(rows[0] ?? { Título: '' });
    const cols = keys.map((k) => {
      const maxLen = Math.max(k.length, ...rows.map((r) => String((r as any)[k] ?? '').length));
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
    (ws as any)['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, folderName || 'Carpeta');

    const fileName =
      (folderName || 'carpeta') +
      (onlySelection && selItems.length ? `-seleccion-${selItems.length}` : '') +
      '.xlsx';

    XLSX.writeFile(wb, fileName);
  };

  // Estados como “chips” rápidos
  const statusChip = (label: 'Todas' | 'pagada' | 'pendiente' | 'anulada' | 'vencida', text: string) => (
    <button
      key={label}
      className={`btn btn-sm rounded-pill ${
        status === label ? 'btn-primary' : 'btn-outline-secondary'
      }`}
      onClick={() => setStatus(label)}
    >
      {text}
    </button>
  );

  return (
    <div className="container py-4">
      {/* Header simple sin botones extra */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-folder fs-3 text-primary" />
          <h2 className="m-0 fw-bold text-primary">{folderName || 'Carpeta'}</h2>
        </div>
        <div className="text-muted small">
          {items.length} factura{items.length !== 1 ? 's' : ''} |{' '}
          {selItems.length ? `${selItems.length} seleccionada${selItems.length > 1 ? 's' : ''}` : 'sin selección'}
        </div>
      </div>

      {/* KPIs */}
      <div className="row g-3 mb-3">
        <div className="col-sm-4"><Kpi label="Monto Neto" value={CLP(kNeto)} /></div>
        <div className="col-sm-4"><Kpi label="IVA" value={CLP(kIva)} /></div>
        <div className="col-sm-4"><Kpi label="Total" value={CLP(kTotal)} /></div>
      </div>

      {/* Barra de filtros sticky */}
      <div
        className="bg-white rounded-4 shadow-sm p-3 mb-3"
        style={{ position: 'sticky', top: 70, zIndex: 10 }}
      >
        {/* Chips de estado */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {statusChip('Todas', 'Todas')}
          {statusChip('pagada', 'Pagadas')}
          {statusChip('pendiente', 'Pendientes')}
          {statusChip('anulada', 'Anuladas')}
          {statusChip('vencida', 'Vencidas')}
          <div className="ms-auto d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill"
              onClick={() => {
                setStatus('Todas'); setQ(''); setMFrom(''); setMTo('');
              }}
              title="Limpiar filtros"
            >
              Limpiar filtros
            </button>
            <button
              className="btn btn-sm btn-outline-primary rounded-pill"
              onClick={() => exportXlsx(false)}
              title="Exportar Excel"
            >
              <i className="bi bi-download me-1" /> Exportar Excel
            </button>
          </div>
        </div>

        <div className="row g-3 align-items-end">
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

          <div className="col-md-3">
            <label className="form-label small">Buscar</label>
            <input
              className="form-control"
              placeholder="Título, folio o proveedor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Acciones de selección */}
        <div className="d-flex align-items-center gap-3 mt-3">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="checkAll" checked={allChecked} onChange={toggleAll} />
            <label className="form-check-label" htmlFor="checkAll">
              Seleccionar todas ({items.length})
            </label>
          </div>
          {selectedIds.size > 0 && (
            <div className="ms-auto d-flex gap-2">
              <span className="badge bg-primary-subtle text-primary rounded-pill">
                {selectedIds.size} seleccionada{selectedIds.size > 1 ? 's' : ''}
              </span>
              <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setSelectedIds(new Set())}>
                Limpiar selección
              </button>
              <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => exportXlsx(true)}>
                Exportar selección
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Listado */}
      <div className="row g-4">
        {items.map((f) => {
          const ff = asMoneyish(f);
          const checked = selectedIds.has(f.id);
          return (
            <div key={f.id} className="col-lg-6">
              <div className={`card border-0 rounded-4 shadow-sm ${checked ? 'border border-primary' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={checked}
                        onChange={() => toggleOne(f.id)}
                      />
                      <h5 className="card-title fw-semibold m-0">{ff.title}</h5>
                    </div>
                    <span
                      className={`badge rounded-pill ${
                        ff.estadoPago === 'pagada'
                          ? 'bg-success'
                          : ff.estadoPago === 'pendiente'
                          ? 'bg-warning text-dark'
                          : ff.estadoPago === 'vencida'
                          ? 'bg-danger'
                          : 'bg-secondary'
                      }`}
                    >
                      {ff.estadoPago || '—'}
                    </span>
                  </div>

                  <div className="text-muted small mt-2">
                    <div><strong>Folio:</strong> {ff.folio || '—'}</div>
                    <div><strong>Proveedor:</strong> {ff.proveedor || '—'}</div>
                    <div><strong>Subida:</strong> {new Date(ff.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="mt-2 small">
                    <span className="me-3"><strong>Neto:</strong> {CLP(ff.neto)}</span>
                    <span className="me-3"><strong>IVA:</strong> {CLP(ff.iva)}</span>
                    <span><strong>Total:</strong> {CLP(ff.total)}</span>
                  </div>

                  <div className="mt-3">
                    <Link href={`/facturas/${ff.id}`} className="btn btn-outline-primary rounded-pill">
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
