'use client';

import { useEffect, useState } from 'react';
import { FaFilePdf, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import Link from 'next/link';

interface Invoice {
  id: string;
  url: string;
  createdAt: string;
  title?: string;
  // nuevos/campo reales:
  proveedor?: string;
  folio?: string;
  total?: number;
  estadoPago: 'pagada' | 'pendiente' | 'anulada' | 'vencida';
  estadoSistema: 'uploaded' | 'parsed' | 'validated' | 'rejected';
}

export default function FacturasPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [dateOrder, setDateOrder] = useState<string>('Recientes');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const verified = localStorage.getItem('sessionVerified') === 'true';
    setIsLoggedIn(!!userId && verified);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/pdf/all')
        .then((res) => res.json())
        .then((data) => {
          // Ya no inventamos estado; usamos el real de Mongo
          setInvoices(data);
        });
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let result = [...invoices];

    if (statusFilter !== 'Todas') {
      result = result.filter((f) => f.estadoPago === statusFilter.toLowerCase());
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateOrder === 'Antiguas' ? dateA - dateB : dateB - dateA;
    });

    setFiltered(result);
  }, [statusFilter, dateOrder, invoices]);

  if (!isLoggedIn) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger">Acceso restringido</h2>
        <p>Debes iniciar sesión y completar la verificación en dos pasos para acceder a esta página.</p>
      </div>
    );
  }

  const badge = (estado: Invoice['estadoPago']) => {
    if (estado === 'pagada') return { cls: 'bg-success', icon: <FaCheckCircle className="me-1" /> };
    if (estado === 'pendiente') return { cls: 'bg-warning text-dark', icon: <FaClock className="me-1" /> };
    if (estado === 'vencida') return { cls: 'bg-danger', icon: <FaTimesCircle className="me-1" /> };
    return { cls: 'bg-secondary', icon: null }; // anulada u otros
  };

  return (
    <div className="container py-5">
      <h2 className="text-primary fw-bold mb-4">📄 Tus Facturas</h2>

      {/* Filtros */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Filtrar por estado de pago:</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="pagada">Pagadas</option>
            <option value="pendiente">Pendientes</option>
            <option value="vencida">Vencidas</option>
            <option value="anulada">Anuladas</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Ordenar por fecha:</label>
          <select
            className="form-select"
            value={dateOrder}
            onChange={(e) => setDateOrder(e.target.value)}
          >
            <option value="Recientes">Más recientes primero</option>
            <option value="Antiguas">Más antiguas primero</option>
          </select>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="row g-4">
        {filtered.map((f) => {
          const nombreArchivo = f.url.split('/').pop() || 'Sin nombre';
          const fecha = new Date(f.createdAt).toLocaleDateString();
          const b = badge(f.estadoPago);

          return (
            <div className="col-md-6 col-lg-4" key={f.id}>
              <div className="card shadow-sm h-100 border-0 rounded-4">
                <div className="card-body">
                  <h5 className="card-title fw-semibold mb-1">{f.title?.trim() || nombreArchivo}</h5>
                  <p className="text-muted mb-2">Subida: {fecha}</p>

                  {f.proveedor && <p className="mb-1"><strong>Proveedor:</strong> {f.proveedor}</p>}
                  {f.folio && <p className="mb-1"><strong>Folio:</strong> {f.folio}</p>}
                  {typeof f.total === 'number' && (
                    <p className="mb-1"><strong>Total:</strong> CLP {f.total.toLocaleString()}</p>
                  )}

                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className={`badge px-3 py-1 rounded-pill ${b.cls}`}>
                      {b.icon}{f.estadoPago.toUpperCase()}
                    </span>
                    <span className="badge px-3 py-1 rounded-pill bg-light text-muted border">
                      {f.estadoSistema.toUpperCase()}
                    </span>
                  </div>

                  <hr />
                  <Link href={`/facturas/${f.id}`} className="btn btn-outline-primary w-100 rounded-pill mt-1">
                    <FaFilePdf className="me-2" /> Ver Factura
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
