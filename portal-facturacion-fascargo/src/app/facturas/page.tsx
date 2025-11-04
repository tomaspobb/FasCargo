// src/app/facturas/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
    // más recientes arriba
    arr.sort((a, b) => b.lastDate - a.lastDate);
    return arr;
  }, [all, q]);

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-folder2-open fs-3 text-primary"></i>
          <h2 className="m-0 fw-bold text-primary">Carpetas</h2>
        </div>

        <Link href="/facturas/subir" className="btn btn-primary rounded-pill">
          <i className="bi bi-upload me-1" />
          Subir nueva factura
        </Link>
      </div>

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

      <div className="row g-4">
        {folders.map((f) => (
          <div key={f.slug} className="col-lg-4 col-md-6">
            <div className="card border-0 rounded-4 shadow-sm h-100">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-start justify-content-between">
                  <h5 className="card-title fw-semibold mb-2">{f.name}</h5>
                  <span className="badge bg-primary-subtle text-primary rounded-pill">
                    {f.count} {f.count === 1 ? 'factura' : 'facturas'}
                  </span>
                </div>

                <div className="text-muted small mb-3">
                  <div><strong>Total acumulado:</strong> {CLP(f.total)}</div>
                  <div><strong>Última carga:</strong> {f.lastDate ? new Date(f.lastDate).toLocaleDateString() : '—'}</div>
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
            </div>
          </div>
        ))}

        {!loading && folders.length === 0 && (
          <div className="col-12">
            <div className="alert alert-secondary">No se encontraron carpetas.</div>
          </div>
        )}
      </div>
    </div>
  );
}
