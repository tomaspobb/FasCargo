'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PdfUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Selecciona un archivo PDF antes de continuar.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF.');
      return;
    }

    if (!name.trim()) {
      setError('Debes ingresar un título para la factura.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name.trim());

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');

      setResponse(data);
      setFile(null);
      setName('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="bg-white p-5 rounded-4 shadow-sm">
        <h2 className="text-primary fw-bold mb-4">📤 Subir nueva factura PDF</h2>

        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Título de la factura</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              placeholder="Ej: Factura Julio 2025"
              disabled={loading}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Selecciona un archivo PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="form-control"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="alert alert-danger rounded-3">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary rounded-pill px-4 mt-2"
            disabled={loading}
          >
            {loading ? 'Subiendo...' : 'Subir PDF'}
          </button>
        </form>

        {response && (
          <div className="mt-5">
            <div className="alert alert-success rounded-4 p-4 shadow-sm">
              <h5 className="fw-bold">✅ PDF subido correctamente</h5>
              <p><strong>Título:</strong> {response.title}</p>
              <p><strong>Subido el:</strong> {new Date(response.createdAt).toLocaleString()}</p>
              <a
                href={response.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary rounded-pill"
              >
                Ver PDF
              </a>
            </div>

            <iframe
              src={response.url}
              width="100%"
              height="500px"
              style={{
                border: '1px solid #ccc',
                borderRadius: '12px',
                marginTop: '20px',
              }}
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
                  setName('');
                  setError(null);
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
