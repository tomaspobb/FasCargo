'use client';

import { useEffect, useState } from 'react';
import { FaFilePdf, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import Link from 'next/link';

interface Invoice {
  id: string;
  url: string;
  createdAt: string;
  title?: string; // Se usará como nombre de la factura
  status?: 'Pagada' | 'Pendiente' | 'Vencida';
}

export default function FacturasPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [dateOrder, setDateOrder] = useState<string>('Recientes');

  // Verifica si hay sesión iniciada y verificada
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const verified = localStorage.getItem('sessionVerified') === 'true';
    setIsLoggedIn(!!userId && verified);
  }, []);

  // Carga las facturas si está logueado
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/pdf/all')
        .then((res) => res.json())
        .then((data) => {
          const estados: ('Pagada' | 'Pendiente' | 'Vencida')[] = ['Pagada', 'Pendiente', 'Vencida'];
          const conEstados = data.map((f: Invoice) => ({
            ...f,
            status: f.status || estados[Math.floor(Math.random() * 3)],
          }));
          setInvoices(conEstados);
        });
    }
  }, [isLoggedIn]);

  // Filtro y orden
  useEffect(() => {
    let result = [...invoices];

    if (statusFilter !== 'Todas') {
      result = result.filter((f) => f.status === statusFilter);
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

  return (
    <div className="container py-5">
      <h2 className="text-primary fw-bold mb-4">📄 Tus Facturas</h2>

      {/* Filtros */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Filtrar por estado:</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="Pagada">Pagadas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Vencida">Vencidas</option>
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

      {/* Tarjetas de facturas */}
      <div className="row g-4">
        {filtered.map((factura) => {
          const nombreArchivo = factura.url.split('/').pop() || 'Sin nombre';
          const fecha = new Date(factura.createdAt).toLocaleDateString();
          const status = factura.status!;

          return (
            <div className="col-md-6 col-lg-4" key={factura.id}>
              <div className="card shadow-sm h-100 border-0 rounded-4">
                <div className="card-body">
                  <h5 className="card-title fw-semibold mb-2">
                    {factura.title?.trim() || nombreArchivo}
                  </h5>
                  <p className="text-muted mb-1">Subida: {fecha}</p>

                  <span className={`badge px-3 py-1 rounded-pill 
                    ${status === 'Pagada' && 'bg-success'} 
                    ${status === 'Pendiente' && 'bg-warning text-dark'} 
                    ${status === 'Vencida' && 'bg-danger'}`}>
                    {status === 'Pagada' && <FaCheckCircle className="me-1" />}
                    {status === 'Pendiente' && <FaClock className="me-1" />}
                    {status === 'Vencida' && <FaTimesCircle className="me-1" />}
                    {status}
                  </span>

                  <hr />

                  <Link
                    href={`/facturas/${factura.id}`}
                    className="btn btn-outline-primary w-100 rounded-pill mt-3"
                  >
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
