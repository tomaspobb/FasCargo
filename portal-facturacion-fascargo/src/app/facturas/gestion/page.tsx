'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Item = {
  id: string;
  title: string;
  createdAt: string;
  estadoPago: 'pagada' | 'pendiente' | 'anulada' | 'vencida';
  total: number | null;
  proveedor?: string | null;
  folio?: string | null;
};

export default function GestionFacturasPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pdf/all');
        const data = await res.json();
        setItems(data);
      } catch (e: any) {
        setError(e.message || 'Error cargando facturas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cuenta por nombre de factura (title)
  const resumen = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const it of items) {
      const key = (it.title || 'Sin título').trim();
      const row = map.get(key) || { count: 0, total: 0 };
      row.count += 1;
      row.total += typeof it.total === 'number' ? it.total : 0;
      map.set(key, row);
    }
    return Array.from(map.entries()).map(([title, v]) => ({
      title,
      cantidad: v.count,
      total: v.total,
    }));
  }, [items]);

  const exportarExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const sheet1 = XLSX.utils.json_to_sheet(
        items.map((it) => ({
          ID: it.id,
          Titulo: it.title,
          Proveedor: it.proveedor || '',
          Folio: it.folio || '',
          Total: typeof it.total === 'number' ? it.total : '',
          Estado: it.estadoPago,
          'Creado el': new Date(it.createdAt).toLocaleString(),
        }))
      );
      XLSX.utils.book_append_sheet(wb, sheet1, 'Facturas');

      const sheet2 = XLSX.utils.json_to_sheet(
        resumen.map((r) => ({
          'Nombre factura': r.title,
          Cantidad: r.cantidad,
          'Suma total': r.total,
        }))
      );
      XLSX.utils.book_append_sheet(wb, sheet2, 'Resumen por nombre');

      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([wbout], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cuenta-facturas_${new Date().toISOString().slice(0,10)}.xlsx`;
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
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, estadoPago: data.estadoPago } : it)));
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold m-0">🏷️ Gestión de facturas</h2>
        <div className="d-flex gap-2">
          <Link href="/dashboard" className="btn btn-outline-secondary">← Dashboard</Link>
          <Link href="/facturas" className="btn btn-outline-primary">← Listado</Link>
          <Link href="/facturas/subir" className="btn btn-primary">+ Subir PDF</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Cargando…</div>}

      {/* Cuenta de facturas */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">📊 Cuenta de facturas (por nombre/título)</h4>
          <button className="btn btn-success" onClick={exportarExcel}>⬇️ Exportar Excel</button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Nombre factura</th>
                <th className="text-end">Cantidad</th>
                <th className="text-end">Suma Total (CLP)</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((r) => (
                <tr key={r.title}>
                  <td>{r.title}</td>
                  <td className="text-end">{r.cantidad}</td>
                  <td className="text-end">{r.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estado de facturas (editable) */}
      <div className="bg-white p-4 rounded-4 shadow-sm">
        <h4 className="mb-3">🛠️ Estado de facturas</h4>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Título</th>
                <th>Proveedor</th>
                <th>Folio</th>
                <th className="text-end">Total</th>
                <th>Estado</th>
                <th className="text-nowrap">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.title}</td>
                  <td>{it.proveedor || '—'}</td>
                  <td>{it.folio || '—'}</td>
                  <td className="text-end">{typeof it.total === 'number' ? it.total.toLocaleString() : '—'}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      style={{ maxWidth: 180 }}
                      disabled={savingId === it.id}
                      value={it.estadoPago}
                      onChange={(e) => updateEstado(it.id, e.target.value as Item['estadoPago'])}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
