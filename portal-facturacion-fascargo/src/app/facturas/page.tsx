'use client';

import { useEffect, useState } from 'react';
import { FaFilePdf, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import Link from 'next/link';

interface Invoice {
  id: string;
  title: string;
  date: string;
  status: 'Pagada' | 'Pendiente' | 'Vencida';
  pdfFile: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '001',
    title: 'Factura #001 - Transporte Santiago',
    date: '2024-05-18',
    status: 'Pagada',
    pdfFile: '001.pdf',
  },
  {
    id: '002',
    title: 'Factura #002 - Carga Valparaíso',
    date: '2024-06-02',
    status: 'Pendiente',
    pdfFile: '002.pdf',
  },
  {
    id: '003',
    title: 'Factura #003 - Despacho Antofagasta',
    date: '2024-06-10',
    status: 'Vencida',
    pdfFile: '003.pdf',
  },
];

export default function FacturasPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const verified = localStorage.getItem('sessionVerified') === 'true';
    setIsLoggedIn(!!userId && verified);
  }, []);

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

      <div className="row g-4">
        {mockInvoices.map((factura) => (
          <div className="col-md-6 col-lg-4" key={factura.id}>
            <div className="card shadow-sm h-100 border-0 rounded-4">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-2">{factura.title}</h5>
                <p className="text-muted mb-1">Emitida: {factura.date}</p>

                <span className={`badge px-3 py-1 rounded-pill 
                  ${factura.status === 'Pagada' && 'bg-success'} 
                  ${factura.status === 'Pendiente' && 'bg-warning text-dark'} 
                  ${factura.status === 'Vencida' && 'bg-danger'}`}>
                  {factura.status === 'Pagada' && <FaCheckCircle className="me-1" />}
                  {factura.status === 'Pendiente' && <FaClock className="me-1" />}
                  {factura.status === 'Vencida' && <FaTimesCircle className="me-1" />}
                  {factura.status}
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
        ))}
      </div>
    </div>
  );
}
