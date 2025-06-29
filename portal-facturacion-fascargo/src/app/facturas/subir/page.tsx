'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PdfUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);

  // Maneja la subida del archivo PDF
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Selecciona un PDF primero');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setResponse(data);
    setFile(null); // Reinicia el input
  };

  return (
    <div className="container mt-5">
      <div className="bg-white p-5 rounded-4 shadow-sm">
        <h2 className="text-primary fw-bold mb-4">📤 Subir nueva factura PDF</h2>

        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Selecciona un archivo PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="form-control"
            />
          </div>

          <button type="submit" className="btn btn-primary rounded-pill px-4 mt-2">
            Subir PDF
          </button>
        </form>

        {/* Muestra el resultado luego de subir */}
        {response && (
          <div className="mt-5">
            <div className="alert alert-success rounded-4 p-4 shadow-sm">
              <h5 className="fw-bold">✅ PDF subido correctamente</h5>
              <p><strong>Nombre:</strong> {response?.url?.split('/').pop() || 'Sin nombre'}</p>
              <p><strong>Subido el:</strong> {new Date(response.createdAt).toLocaleString()}</p>
              <a href={response.url} target="_blank" rel="noreferrer" className="btn btn-outline-primary rounded-pill">
                Ver PDF
              </a>
            </div>

            <iframe
              src={response.url}
              width="100%"
              height="500px"
              style={{ border: '1px solid #ccc', borderRadius: '12px', marginTop: '20px' }}
              title="PDF Subido"
            ></iframe>

            <div className="d-flex gap-3 mt-4">
              <Link
                href="/dashboard"
                className="btn btn-success rounded-pill px-4 fw-semibold"
              >
                Ir al Dashboard
              </Link>

              <button
                onClick={() => {
                  setResponse(null);
                  setFile(null);
                }}
                className="btn btn-secondary rounded-pill px-4"
              >
                Subir otro PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
