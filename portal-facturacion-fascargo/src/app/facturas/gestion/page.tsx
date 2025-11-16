// src/app/facturas/gestion/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { CLP, groupKey } from '@/lib/utils';

type Item = {
  id: string;
  title: string;
  createdAt: string;
  estadoPago: 'pagada' | 'pendiente' | 'anulada' | 'vencida';
  total: number | null;
  proveedor?: string | null;
  folio?: string | null;
  // puede venir folderName del backend, pero usamos groupKey para estandarizar
};

type FolderRow = {
  name: string;
  count: number;
  total: number;
};

const monthToRange = (m: string) => {
  const [y, mm] = m.split('-').map(Number);
  const start = new Date(y, mm - 1, 1, 0, 0, 0);
  const end = new Date(y, mm, 0, 23, 59, 59, 999);
  return { start, end };
};

export default function GestionFacturasPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState('');
  const [estado, setEstado] =
    useState<'todas' | 'pagada' | 'pendiente' | 'vencida' | 'anulada'>('todas');
  const [sort, setSort] =
    useState<'fecha-desc' | 'fecha-asc' | 'monto-desc' | 'monto-asc'>('fecha-desc');
  const [mFrom, setMFrom] = useState<string>(''); // 'YYYY-MM'
  const [mTo, setMTo] = useState<string>('');

  // modal por carpeta
  const [showFolder, setShowFolder] = useState(false);
  const [folderName, setFolderName] = useState<string>('');
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState<5 | 10 | 25>(10);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pdf/all', { cache: 'no-store' });
        const data = await res.json();
        setItems(data || []);
      } catch (e: any) {
        setError(e?.message || 'Error cargando facturas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // aplica filtros base
  const filtered = useMemo(() => {
    let arr = [...items];

    if (estado !== 'todas') arr = arr.filter((d) => d.estadoPago === estado);

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      arr = arr.filter((d) => {
        const folder = groupKey(d);
        return (
          (d.title || '').toLowerCase().includes(term) ||
          (d.proveedor || '').toLowerCase().includes(term) ||
          (d.folio || '').toLowerCase().includes(term) ||
          (folder || '').toLowerCase().includes(term)
        );
      });
    }

    if (mFrom) {
      const { start } = monthToRange(mFrom);
      arr = arr.filter((d) => +new Date(d.createdAt) >= +start);
    }
    if (mTo) {
      const { end } = monthToRange(mTo);
      arr = arr.filter((d) => +new Date(d.createdAt) <= +end);
    }

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
  }, [items, q, estado, sort, mFrom, mTo]);

  // KPIs (sobre filtrados si hay, si no sobre todos)
  const kpi = useMemo(() => {
    const base = filtered.length ? filtered : items;
    const totalDocs = base.length;
    const totalMonto = base.reduce(
      (acc, it) => acc + (typeof it.total === 'number' ? it.total : 0),
      0
    );
    const pagadas = base.filter((d) => d.estadoPago === 'pagada').length;
    const pendientes = base.filter((d) => d.estadoPago === 'pendiente').length;
    const vencidas = base.filter((d) => d.estadoPago === 'vencida').length;
    const anuladas = base.filter((d) => d.estadoPago === 'anulada').length;
    return { totalDocs, totalMonto, pagadas, pendientes, vencidas, anuladas };
  }, [items, filtered]);

  // Resumen POR CARPETA
  const resumenCarpetas = useMemo<FolderRow[]>(() => {
    const base = filtered.length ? filtered : items;
    const map = new Map<string, { count: number; total: number }>();
    for (const it of base) {
      const name = groupKey(it) || '—';
      const row = map.get(name) || { count: 0, total: 0 };
      row.count += 1;
      row.total += typeof it.total === 'number' ? it.total : 0;
      map.set(name, row);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, count: v.count, total: v.total }))
      .sort((a, b) => b.total - a.total || b.count - a.count || a.name.localeCompare(b.name));
  }, [items, filtered]);

  // datos del modal por carpeta (filtrados + carpeta)
  const modalInvoices = useMemo(() => {
    if (!folderName) return [];
    const arr = filtered.filter((it) => (groupKey(it) || '—') === folderName);
    const start = (modalPage - 1) * modalPageSize;
    return arr.slice(start, start + modalPageSize);
  }, [filtered, folderName, modalPage, modalPageSize]);

  const modalTotalInvoices = useMemo(() => {
    if (!folderName) return 0;
    return filtered.filter((it) => (groupKey(it) || '—') === folderName).length;
  }, [filtered, folderName]);

  const totalModalPages = Math.max(1, Math.ceil(modalTotalInvoices / modalPageSize));

  const openFolderModal = (name: string) => {
    setFolderName(name);
    setModalPage(1);
    setShowFolder(true);
  };
  const closeFolderModal = () => setShowFolder(false);

  const exportarExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const base = filtered.length ? filtered : items;

      const sheet1 = XLSX.utils.json_to_sheet(
        base.map((it) => ({
          ID: it.id,
          Carpeta: groupKey(it) || '',
          Titulo: it.title,
          Proveedor: it.proveedor || '',
          Folio: it.folio || '',
          Total: typeof it.total === 'number' ? it.total : '',
          Estado: it.estadoPago,
          'Creado el': new Date(it.createdAt).toLocaleString(),
        }))
      );
      XLSX.utils.book_append_sheet(wb, sheet1, 'Facturas (filtradas)');

      const sheet2 = XLSX.utils.json_to_sheet(
        resumenCarpetas.map((r) => ({
          Carpeta: r.name,
          Cantidad: r.count,
          'Suma total (CLP)': r.total,
        }))
      );
      XLSX.utils.book_append_sheet(wb, sheet2, 'Resumen por carpeta');

      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gestion-por-carpetas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('No se pudo exportar');
      console.error(e);
    }
  };

  const updateEstado = async (id: string, estado: Item['estadoPago']) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/pdf/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoPago: estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, estadoPago: data.estadoPago } : it))
      );
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-tags-fill fs-4 text-primary" />
        <h2 className="text-primary fw-bold m-0">Gestión de facturas</h2>
      </div>

      {/* Controles */}
      <div className="bg-white p-3 rounded-4 shadow-sm mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small">Buscar</label>
            <input
              className="form-control"
              placeholder="Carpeta, título, proveedor o folio…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small">Estado</label>
            <select
              className="form-select"
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
            >
              <option value="todas">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagada">Pagadas</option>
              <option value="vencida">Vencidas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small">Orden</label>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="fecha-desc">Más recientes primero</option>
              <option value="fecha-asc">Más antiguos primero</option>
              <option value="monto-desc">Monto mayor</option>
              <option value="monto-asc">Monto menor</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small">Mes desde</label>
            <input
              type="month"
              className="form-control"
              value={mFrom}
              onChange={(e) => setMFrom(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small">Mes hasta</label>
            <input
              type="month"
              className="form-control"
              value={mTo}
              onChange={(e) => setMTo(e.target.value)}
            />
          </div>
        </div>

        <div className="d-flex gap-2 mt-3">
          {(q || estado !== 'todas' || mFrom || mTo) && (
            <button
              className="btn btn-outline-secondary rounded-pill"
              onClick={() => {
                setQ('');
                setEstado('todas');
                setMFrom('');
                setMTo('');
              }}
            >
              Limpiar filtros
            </button>
          )}
          <button className="btn btn-success rounded-pill" onClick={exportarExcel}>
            <i className="bi bi-download me-1" />
            Exportar Excel
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Cargando…</div>}

      {/* KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-2">
          <div className="p-3 rounded-4 bg-white border h-100">
            <div className="text-muted small">Facturas</div>
            <div className="fs-4 fw-bold">{kpi.totalDocs}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 rounded-4 bg-white border h-100">
            <div className="text-muted small">Monto total</div>
            <div className="fs-5 fw-bold">{CLP(kpi.totalMonto)}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="p-3 rounded-4 bg-white border h-100">
            <div className="text-muted small">Pagadas</div>
            <div className="fs-4 fw-bold text-success">{kpi.pagadas}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="p-3 rounded-4 bg-white border h-100">
            <div className="text-muted small">Pendientes</div>
            <div className="fs-4 fw-bold text-warning">{kpi.pendientes}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="p-3 rounded-4 bg-white border h-100">
            <div className="text-muted small">Vencidas</div>
            <div className="fs-4 fw-bold text-danger">{kpi.vencidas}</div>
          </div>
        </div>
        <div className="col-6 col-md-1">
          <div className="p-3 rounded-4 bg-white border h-100">
            <div className="text-muted small">Anuladas</div>
            <div className="fs-5 fw-bold">{kpi.anuladas}</div>
          </div>
        </div>
      </div>

      {/* Resumen por carpeta */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-collection fs-5 text-primary" />
          <h4 className="m-0">📁 Resumen por carpeta</h4>
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle">
            <thead>
              <tr>
                <th>Carpeta</th>
                <th className="text-end">Cantidad</th>
                <th className="text-end">Suma Total (CLP)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resumenCarpetas.map((r) => (
                <tr key={r.name}>
                  <td className="fw-semibold">{r.name}</td>
                  <td className="text-end">{r.count}</td>
                  <td className="text-end">{CLP(r.total)}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-outline-primary btn-sm rounded-pill"
                      onClick={() => openFolderModal(r.name)}
                    >
                      Ver facturas
                    </button>
                  </td>
                </tr>
              ))}
              {resumenCarpetas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-3">
                    Sin datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="form-text">
          Tip: los filtros de arriba también afectan este resumen.
        </div>
      </div>

      {/* MODAL: Facturas de la carpeta */}
      {showFolder && (
        <div
          className="modal fade show"
          style={{ display: 'block', background: 'rgba(0,0,0,.35)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">
                  Facturas en <span className="text-primary fw-bold">{folderName}</span>
                </h5>
                <button className="btn-close" onClick={closeFolderModal} />
              </div>

              <div className="modal-body">
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <div className="text-muted small me-auto">
                    {modalTotalInvoices} factura
                    {modalTotalInvoices !== 1 ? 's' : ''} encontradas
                  </div>
                  <label className="form-label small m-0">Por página</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 90 }}
                    value={modalPageSize}
                    onChange={(e) => {
                      setModalPageSize(Number(e.target.value) as 5 | 10 | 25);
                      setModalPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Proveedor</th>
                        <th>Folio</th>
                        <th className="text-end">Total</th>
                        <th>Estado</th>
                        <th className="text-nowrap">Creado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalInvoices.map((it) => (
                        <tr key={it.id}>
                          <td>{it.title}</td>
                          <td>{it.proveedor || '—'}</td>
                          <td>{it.folio || '—'}</td>
                          <td className="text-end">
                            {typeof it.total === 'number' ? CLP(it.total) : '—'}
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              style={{ maxWidth: 180 }}
                              disabled={savingId === it.id}
                              value={it.estadoPago}
                              onChange={(e) =>
                                updateEstado(it.id, e.target.value as Item['estadoPago'])
                              }
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="pagada">Pagada</option>
                              <option value="vencida">Vencida</option>
                              <option value="anulada">Anulada</option>
                            </select>
                          </td>
                          <td>{new Date(it.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {modalInvoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-3">
                            No hay facturas en esta página
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación dentro del modal */}
                <div className="d-flex align-items-center justify-content-between mt-2">
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill"
                    onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                    disabled={modalPage <= 1}
                  >
                    ← Anterior
                  </button>
                  <div className="small text-muted">
                    Página {modalPage} de {totalModalPages}
                  </div>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill"
                    onClick={() =>
                      setModalPage((p) => Math.min(totalModalPages, p + 1))
                    }
                    disabled={modalPage >= totalModalPages}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary rounded-pill" onClick={closeFolderModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
