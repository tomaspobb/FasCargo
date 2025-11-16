// src/app/facturas/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CLP, InvoiceDTO, groupKey, slugify } from '@/lib/utils';

type Folder = {
  name: string;
  slug: string;
  count: number;
  total: number;
  lastDate: number;
};

export default function FacturasFoldersPage() {
  const [all, setAll] = useState<InvoiceDTO[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  // ===== Modal "Crear carpeta" =====
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSearch, setCreateSearch] = useState('');
  const [createSelected, setCreateSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false); // <— NUEVO: spinner/disable mientras se mueve
  const pendingMoveInvoiceId = useRef<string | null>(null);

  // ===== Selección rápida =====
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ===== Carga inicial =====
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pdf/all', { cache: 'no-store' });
      const data = await res.json();
      setAll(data || []);
    } finally {
      setLoading(false);
    }
  };

  // ===== Carpetas derivadas =====
  const folders = useMemo<Folder[]>(() => {
    const map = new Map<string, Folder>();
    for (const inv of all) {
      const name = groupKey(inv);
      const f = map.get(name) ?? {
        name,
        slug: slugify(name),
        count: 0,
        total: 0,
        lastDate: 0,
      };
      f.count += 1;
      f.total += inv.total || 0;
      f.lastDate = Math.max(f.lastDate, new Date(inv.createdAt).getTime());
      map.set(name, f);
    }
    let arr = Array.from(map.values());
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter((f) => f.name.toLowerCase().includes(s));
    }
    arr.sort((a, b) => b.lastDate - a.lastDate);
    return arr;
  }, [all, q]);

  const folderNames = useMemo(() => folders.map((f) => f.name), [folders]);

  // ===== Helpers =====
// dentro de src/app/facturas/page.tsx
const moveInvoiceToFolder = async (invoiceId: string, folderName: string) => {
  try {
    const res = await fetch(`/api/pdf/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      console.error('PATCH /api/pdf/:id fallo:', e);
      return;
    }
    await refreshAll(); // <-- recarga lista con folderName ya incluido
  } catch (err) {
    console.error('PATCH /api/pdf/:id error:', err);
  }
};

  // ====== Modal Crear Carpeta ======
  const openCreateModal = (suggest?: string, moveInvoiceId?: string) => {
    setCreateName(suggest ?? '');
    setCreateSearch('');
    const seed = new Set<string>();
    if (moveInvoiceId) seed.add(moveInvoiceId);
    setCreateSelected(seed);
    pendingMoveInvoiceId.current = moveInvoiceId ?? null;
    setShowCreate(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setShowCreate(false);
    setCreateName('');
    setCreateSearch('');
    setCreateSelected(new Set());
    pendingMoveInvoiceId.current = null;
  };

  const modalList = useMemo(() => {
    const term = createSearch.trim().toLowerCase();
    let arr = [...all].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (term) {
      arr = arr.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(term) ||
          (i.folio || '').toLowerCase().includes(term) ||
          (i.proveedor || '').toLowerCase().includes(term) ||
          groupKey(i).toLowerCase().includes(term),
      );
    }
    return arr.slice(0, 50);
  }, [all, createSearch]);

  const toggleModalSelect = (id: string) => {
    setCreateSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

const createFolderAndMove = async () => {
  const name = createName.trim();
  if (!name || createSelected.size === 0) return;
  const ids = Array.from(createSelected);

  await Promise.all(ids.map((id) => moveInvoiceToFolder(id, name)));
  await refreshAll();               // 👈 asegura que la grilla refleje la carpeta
  closeCreateModal();
};

  // ===== Listado inferior =====
  const loose = useMemo(
    () => [...all].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [all],
  );

  const PAGE = 12;
  const [page, setPage] = useState(1);
  const pageItems = useMemo(() => loose.slice(0, PAGE * page), [loose, page]);
  const canShowMore = PAGE * page < loose.length;

  const toggleQuickSelect = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const clearSelection = () => setSelectedIds(new Set());

  const moveSelectionTo = async (folderName: string) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      for (const id of ids) await moveInvoiceToFolder(id, folderName);
      await refreshAll();
    } catch (e) {
      alert('No se pudo mover alguna factura');
    } finally {
      clearSelection();
    }
  };

  // ===== UI =====
  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-folder2-open fs-3 text-primary"></i>
          <h2 className="m-0 fw-bold text-primary">Carpetas</h2>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-dark rounded-pill"
            onClick={() => openCreateModal('')}
            title="Crear carpeta"
          >
            <i className="bi bi-folder-plus me-1" />
            Crear carpeta
          </button>

          <Link href="/facturas/subir" className="btn btn-primary rounded-pill">
            <i className="bi bi-upload me-1" />
            Subir nueva factura
          </Link>
        </div>
      </div>

      {/* Buscador carpetas */}
      <div className="row g-3 mb-3">
        <div className="col-md-6 col-lg-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="form-control"
            placeholder="Buscar carpeta por nombre…"
          />
        </div>
      </div>

      {loading && <div className="alert alert-info">Cargando facturas…</div>}

      {/* Grid carpetas */}
      <div className="row g-4 mb-4">
        {folders.map((f) => (
          <div key={f.slug} className="col-lg-4 col-md-6">
            <div
              className="card border-0 rounded-4 shadow-sm h-100"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                const id = e.dataTransfer.getData('text/invoice-id');
                if (id) {
                  try {
                    await moveInvoiceToFolder(id, f.name);
                    await refreshAll();
                  } catch (err) {
                    alert('No se pudo mover la factura');
                  }
                }
              }}
            >
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-start justify-content-between">
                  <h5 className="card-title fw-semibold mb-2">{f.name}</h5>
                  <span className="badge bg-primary-subtle text-primary rounded-pill">
                    {f.count} {f.count === 1 ? 'factura' : 'facturas'}
                  </span>
                </div>

                <div className="text-muted small mb-3">
                  <div>
                    <strong>Total acumulado:</strong> {CLP(f.total)}
                  </div>
                  <div>
                    <strong>Última carga:</strong>{' '}
                    {f.lastDate ? new Date(f.lastDate).toLocaleDateString() : '—'}
                  </div>
                </div>

                <div className="mt-auto">
                  <Link
                    href={`/facturas/carpeta/${f.slug}?name=${encodeURIComponent(f.name)}`}
                    className="btn btn-outline-primary w-100 rounded-pill"
                  >
                    Ver carpeta
                  </Link>
                </div>
              </div>

              <div className="px-3 pb-3 text-muted small">
                Sugerencia: arrastra facturas aquí para moverlas a <strong>{f.name}</strong>.
              </div>
            </div>
          </div>
        ))}

        {!loading && folders.length === 0 && (
          <div className="col-12">
            <div className="alert alert-secondary">No se encontraron carpetas.</div>
          </div>
        )}
      </div>

      {/* Listado inferior */}
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-journals"></i>
        <h5 className="m-0">Facturas (arrástralas a una carpeta)</h5>
      </div>

      <div className="row g-3">
        {pageItems.map((it) => {
          const k = groupKey(it);
          const checked = selectedIds.has(it.id);
          return (
            <div key={it.id} className="col-xl-4 col-lg-6">
              <div
                className={`p-3 rounded-4 border bg-white shadow-sm h-100 ${
                  checked ? 'border-primary' : 'border-0'
                }`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/invoice-id', it.id);
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="fw-semibold">{it.title}</div>
                  <div className="text-muted small">
                    {new Date(it.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-muted small">
                  <div>
                    <strong>Carpeta actual:</strong> {k || '—'}
                  </div>
                  <div>
                    <strong>Folio:</strong> {it.folio || '—'}
                  </div>
                  <div>
                    <strong>Total:</strong> {CLP(typeof it.total === 'number' ? it.total : 0)}
                  </div>
                </div>

                <div className="mt-2 d-flex gap-2 align-items-center">
                  <Link
                    href={`/facturas/${it.id}`}
                    className="btn btn-outline-primary btn-sm rounded-pill"
                  >
                    Ver
                  </Link>

                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-outline-secondary rounded-pill dropdown-toggle"
                      data-bs-toggle="dropdown"
                    >
                      Mover a carpeta…
                    </button>
                    <ul className="dropdown-menu">
                      {folderNames.map((fn) => (
                        <li key={fn}>
                          <button
                            className="dropdown-item"
                            onClick={async () => {
                              try {
                                await moveInvoiceToFolder(it.id, fn);
                                await refreshAll();
                              } catch {
                                alert('No se pudo mover la factura');
                              }
                            }}
                          >
                            {fn}
                          </button>
                        </li>
                      ))}
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => openCreateModal('', it.id)}
                        >
                          <i className="bi bi-folder-plus me-2" />
                          Crear carpeta…
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div className="form-check ms-auto">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQuickSelect(it.id)}
                      id={`sel-${it.id}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!pageItems.length && !loading && (
          <div className="col-12">
            <div className="alert alert-secondary">No hay facturas para mostrar.</div>
          </div>
        )}
      </div>

      {canShowMore && (
        <div className="text-center mt-3">
          <button
            className="btn btn-outline-secondary rounded-pill"
            onClick={() => setPage((p) => p + 1)}
          >
            Cargar más
          </button>
        </div>
      )}

      {/* Acciones de selección múltiple */}
      {selectedIds.size > 0 && (
        <div className="alert alert-info rounded-4 mt-4 d-flex align-items-center justify-content-between">
          <div>{selectedIds.size} seleccionada{selectedIds.size > 1 ? 's' : ''}.</div>
          <div className="d-flex gap-2">
            <div className="dropdown">
              <button
                className="btn btn-primary btn-sm rounded-pill dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Mover selección a…
              </button>
              <ul className="dropdown-menu">
                {folderNames.map((fn) => (
                  <li key={fn}>
                    <button
                      className="dropdown-item"
                      onClick={() => moveSelectionTo(fn)}
                    >
                      {fn}
                    </button>
                  </li>
                ))}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => openCreateModal('')}>
                    <i className="bi bi-folder-plus me-2" />
                    Crear carpeta…
                  </button>
                </li>
              </ul>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill"
              onClick={clearSelection}
            >
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      {/* ===== Modal Crear Carpeta ===== */}
      {showCreate && (
        <div
          className="modal fade show"
          style={{ display: 'block', background: 'rgba(0,0,0,.35)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">Crear carpeta</h5>
                <button className="btn-close" onClick={closeCreateModal} disabled={creating}></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Nombre de la carpeta</label>
                  <input
                    className="form-control"
                    placeholder="Ej: Transporte Leis"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="mb-2 d-flex align-items-center justify-content-between">
                  <label className="form-label small m-0">
                    Selecciona al menos <strong>una factura</strong> para crear la carpeta
                  </label>
                  <input
                    className="form-control"
                    style={{ maxWidth: 320 }}
                    placeholder="Buscar por título, folio, proveedor…"
                    value={createSearch}
                    onChange={(e) => setCreateSearch(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="table-responsive border rounded-3">
                  <table className="table table-sm align-middle m-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 36 }}></th>
                        <th>Título</th>
                        <th>Carpeta actual</th>
                        <th>Folio</th>
                        <th className="text-end">Total</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalList.map((it) => {
                        const checked = createSelected.has(it.id);
                        return (
                          <tr key={it.id}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={checked}
                                onChange={() => toggleModalSelect(it.id)}
                                aria-label={`Seleccionar ${it.title}`}
                                disabled={creating}
                              />
                            </td>
                            <td className="text-truncate" style={{ maxWidth: 280 }}>
                              {it.title}
                            </td>
                            <td className="text-muted small">{groupKey(it)}</td>
                            <td className="text-muted small">{it.folio || '—'}</td>
                            <td className="text-end">{CLP(typeof it.total === 'number' ? it.total : 0)}</td>
                            <td className="text-muted small">
                              {new Date(it.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                      {modalList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-3">
                            No hay resultados para tu búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="form-text mt-2">
                  Consejo: puedes abrir este modal desde “Mover a carpeta… → Crear carpeta” en una
                  factura; esa factura quedará pre-seleccionada aquí.
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeCreateModal} disabled={creating}>
                  Cancelar
                </button>
                <button
                  className="btn btn-dark"
                  onClick={createFolderAndMove}
                  disabled={!createName.trim() || createSelected.size === 0 || creating}
                  title={
                    !createName.trim()
                      ? 'Ingresa el nombre de la carpeta'
                      : createSelected.size === 0
                      ? 'Selecciona al menos una factura'
                      : 'Crear carpeta'
                  }
                >
                  {creating ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
