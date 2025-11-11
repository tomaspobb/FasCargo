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

type Inv = InvoiceDTO & { folder?: string | null };

export default function FacturasFoldersPage() {
  const [all, setAll] = useState<Inv[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  // UI: crear carpeta (modal)
  const [showModal, setShowModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pdf/all', { cache: 'no-store' });
        const data = await res.json();
        setAll(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const folders = useMemo<Folder[]>(() => {
    const map = new Map<string, Folder>();
    for (const inv of all) {
      const manual = (inv as Inv).folder?.trim();
      const name = manual && manual.length > 0 ? manual : groupKey(inv);
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
    // más recientes arriba
    arr.sort((a, b) => b.lastDate - a.lastDate);
    return arr;
  }, [all, q]);

  // Bandeja de facturas para drag & drop (limitamos a 50 por UI)
  const trayInvoices = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = all.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (s) {
      arr = arr.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(s) ||
          (i.proveedor || '').toLowerCase().includes(s) ||
          (i.folio || '').toLowerCase().includes(s),
      );
    }
    return arr.slice(0, 50);
  }, [all, q]);

  // Todas las carpetas disponibles (para mover por botón)
  const allFolderNames = useMemo(() => folders.map((f) => f.name), [folders]);

  // Drag start: ponemos el id y el folder actual
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  // Drop en una carpeta: PATCH folder
  const onDropToFolder = async (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    await moveInvoiceToFolder(id, folderName);
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  // Mover por botón/selector
  const moveInvoiceToFolder = async (id: string, folderName: string) => {
    try {
      const res = await fetch(`/api/pdf/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: folderName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo mover');
      // Refrescar en memoria
      setAll((prev) => prev.map((p) => (p.id === id ? { ...p, folder: folderName } : p)));
    } catch (e: any) {
      alert(e.message || 'Error al mover la factura');
    }
  };

  // Crear carpeta (no requiere API propia: basta con asignar una factura a esa carpeta.
  // Aun así, dejamos la opción de crear "vacía" para que aparezca en la grilla:
  // esto se logra creando un "placeholder" en el estado local; desaparecerá si queda vacía
  // después de refrescar. UX: Mostramos alerta con tip.
  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const exist = folders.some((f) => f.name.toLowerCase() === name.toLowerCase());
    if (exist) {
      alert('Ya existe una carpeta con ese nombre.');
      return;
    }
    // Insertamos un placeholder local (count 0)
    const placeholder: Folder = {
      name,
      slug: slugify(name),
      count: 0,
      total: 0,
      lastDate: Date.now(),
    };
    // Hack simple: añadimos al "estado" de all un fake "carpeta virtual" con id temporal para que se renderice.
    // Más simple: guardamos en un estado auxiliar de carpetas vacías:
    setVirtualFolders((prev) => {
      const set = new Set(prev);
      set.add(name);
      return set;
    });
    setShowModal(false);
    setNewFolderName('');
    setTimeout(() => {
      alert(
        'Carpeta creada. Arrastra facturas desde la bandeja a esta carpeta para que se mantenga.',
      );
    }, 50);
  };

  // Carpetas creadas sin facturas todavía (solo UI)
  const [virtualFolders, setVirtualFolders] = useState<Set<string>>(new Set());

  // Lista final a mostrar = folders reales + virtuales
  const foldersUI = useMemo(() => {
    const ui = [...folders];
    for (const name of virtualFolders) {
      const exists = folders.some((f) => f.name === name);
      if (!exists) {
        ui.push({
          name,
          slug: slugify(name),
          count: 0,
          total: 0,
          lastDate: Date.now(),
        });
      }
    }
    // ordenar por lastDate desc
    ui.sort((a, b) => b.lastDate - a.lastDate);
    return ui;
  }, [folders, virtualFolders]);

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-folder2-open fs-3 text-primary"></i>
          <h2 className="m-0 fw-bold text-primary">Carpetas</h2>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary rounded-pill"
            onClick={() => setShowModal(true)}
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

      {/* Filtros */}
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

      {/* Grid de carpetas con Drop Targets */}
      <div className="row g-4 mb-4">
        {foldersUI.map((f) => (
          <div key={f.slug} className="col-lg-4 col-md-6">
            <div
              className="card border-0 rounded-4 shadow-sm h-100"
              onDragOver={allowDrop}
              onDrop={(e) => onDropToFolder(e, f.name)}
            >
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-start justify-content-between">
                  <h5 className="card-title fw-semibold mb-2">{f.name}</h5>
                  <span className="badge bg-primary-subtle text-primary rounded-pill">
                    {f.count} {f.count === 1 ? 'factura' : 'facturas'}
                  </span>
                </div>

                <div className="text-muted small mb-3">
                  <div><strong>Total acumulado:</strong> {CLP(f.total)}</div>
                  <div>
                    <strong>Última carga:</strong>{' '}
                    {f.lastDate ? new Date(f.lastDate).toLocaleDateString() : '—'}
                  </div>
                </div>

                <div className="mt-auto d-flex gap-2">
                  <Link
                    href={`/facturas/carpeta/${f.slug}?name=${encodeURIComponent(f.name)}`}
                    className="btn btn-outline-primary w-100 rounded-pill"
                  >
                    Ver carpeta
                  </Link>
                </div>

                <div className="small text-muted mt-2">
                  Sugerencia: arrastra facturas aquí para moverlas a <strong>{f.name}</strong>.
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && foldersUI.length === 0 && (
          <div className="col-12">
            <div className="alert alert-secondary">No se encontraron carpetas.</div>
          </div>
        )}
      </div>

      {/* Bandeja de facturas arrastrables */}
      <div className="bg-white rounded-4 shadow-sm p-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <i className="bi bi-collection"></i>
          <h5 className="m-0">Facturas (arrástralas a una carpeta)</h5>
        </div>
        <div className="row g-3">
          {trayInvoices.map((it) => {
            const currentFolder =
              (it as Inv).folder?.trim() || groupKey(it);
            return (
              <div key={it.id} className="col-xl-3 col-lg-4 col-md-6">
                <div
                  className="p-3 border rounded-3 h-100 bg-light-subtle"
                  draggable
                  onDragStart={(e) => onDragStart(e, it.id)}
                  title="Arrastra a una carpeta para moverla"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="fw-semibold text-truncate" title={it.title || 'Factura'}>
                      {it.title || 'Factura'}
                    </div>
                    <span className="badge text-bg-light">{new Date(it.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="small text-muted text-truncate" title={currentFolder}>
                    Carpeta actual: <strong>{currentFolder}</strong>
                  </div>
                  <div className="small text-muted">
                    Total: {typeof it.total === 'number' ? CLP(it.total) : '—'}
                  </div>

                  <div className="mt-2 d-flex flex-wrap gap-2">
                    <Link href={`/facturas/${it.id}`} className="btn btn-sm btn-outline-primary rounded-pill">
                      Ver
                    </Link>

                    {/* Mover por selector */}
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-outline-secondary rounded-pill dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        type="button"
                      >
                        Mover a carpeta…
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        {allFolderNames.map((name) => (
                          <li key={name}>
                            <button
                              className="dropdown-item"
                              onClick={() => moveInvoiceToFolder(it.id, name)}
                            >
                              {name}
                            </button>
                          </li>
                        ))}
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={async () => {
                              const name = window.prompt('Nombre de nueva carpeta:')?.trim();
                              if (!name) return;
                              await moveInvoiceToFolder(it.id, name);
                              // opcional: si queremos asegurar que aparezca en UI aunque aún no recarguemos
                              setVirtualFolders((prev) => new Set(prev).add(name));
                            }}
                          >
                            + Crear nueva carpeta…
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {trayInvoices.length === 0 && (
            <div className="col-12">
              <div className="alert alert-secondary m-0">No hay facturas para mostrar.</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear carpeta */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} ref={modalRef} role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Crear carpeta</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Cerrar"
                />
              </div>
              <div className="modal-body">
                <label className="form-label small">Nombre de la carpeta</label>
                <input
                  autoFocus
                  className="form-control"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ej: Transporte Leis"
                />
                <div className="form-text">
                  Luego arrastra facturas a esta carpeta para que quede registrada.
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary rounded-pill" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary rounded-pill" onClick={createFolder}>
                  Crear
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowModal(false)} />
        </div>
      )}
    </div>
  );
}
