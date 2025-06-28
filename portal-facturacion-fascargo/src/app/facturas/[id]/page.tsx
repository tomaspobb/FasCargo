'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configura la versión del worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;

const invoiceMap: Record<string, { title: string; file: string }> = {
  '001': { title: 'Factura #001 - Transporte Santiago', file: '/pdfs/001.pdf' },
  '002': { title: 'Factura #002 - Carga Valparaíso', file: '/pdfs/002.pdf' },
  '003': { title: 'Factura #003 - Despacho Antofagasta', file: '/pdfs/003.pdf' },
};

export default function VerFacturaPage() {
  const { id } = useParams();
  const factura = invoiceMap[id as string];
  const [numPages, setNumPages] = useState<number | null>(null);

  if (!factura) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger">Factura no encontrada</h2>
        <p>Revisa el enlace e intenta nuevamente.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h3 className="text-primary fw-bold mb-4">📄 Visualizando {factura.title}</h3>
      <div className="d-flex justify-content-center">
        <Document
          file={factura.file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading="Cargando factura..."
          error="Error al cargar el archivo PDF"
        >
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={800}
              className="border mb-4 shadow-sm rounded-3"
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
