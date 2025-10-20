'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// usa un worker público para evitar bundling pesado
GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function normalizeSpaces(s: string) {
  return s.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}
function toNumberMoney(input?: string) {
  if (!input) return undefined;
  const clean = input.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(clean);
  return Number.isFinite(n) ? n : undefined;
}
function toDateMaybe(s?: string): string | undefined {
  if (!s) return undefined;
  const m1 = s.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚñ]+)\s+(?:del?\s+)?(\d{4})/i);
  if (m1) {
    const d = +m1[1];
    const y = +m1[3];
    const months: Record<string, number> = {
      enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12
    };
    const mo = months[m1[2].toLowerCase()] || 0;
    if (mo) {
      const dt = new Date(y, mo - 1, d);
      return isNaN(dt.getTime()) ? undefined : dt.toISOString();
    }
  }
  const m2 = s.match(/([0-3]?\d)[\/\-\.]([01]?\d)[\/\-\.](\d{2,4})/);
  if (m2) {
    const d = +m2[1]; const mo = +m2[2]; let y = +m2[3]; if (y < 100) y += 2000;
    const dt = new Date(y, mo - 1, d);
    return isNaN(dt.getTime()) ? undefined : dt.toISOString();
  }
  return undefined;
}

async function extractInBrowser(file: File) {
  const buf = await file.arrayBuffer();
  const loadingTask = getDocument({ data: buf, isEvalSupported: false });
  const pdf = await loadingTask.promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    // ✅ sin opciones; normalizamos nosotros
    const content = await page.getTextContent();
    text += (content.items as any[])
      .map((it) => (typeof (it as any).str === 'string' ? (it as any).str : ''))
      .join('\n') + '\n';
  }
  text = normalizeSpaces(text);

  const matchOne = (list: RegExp[]) => {
    for (const re of list) {
      const m = text.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return undefined;
  };
  const matchLastNum = (list: RegExp[]) => {
    for (const re0 of list) {
      const re = new RegExp(re0.source, re0.flags.includes('g') ? re0.flags : re0.flags + 'g');
      let m: RegExpMatchArray | null, last: RegExpMatchArray | null = null;
      while ((m = re.exec(text)) !== null) last = m;
      if (last?.[1]) {
        const n = toNumberMoney(last[1]);
        if (typeof n === 'number') return n;
      }
    }
    return undefined;
  };

  const proveedor =
    matchOne([
      /([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+R\.?U\.?T\.?/i,
      /([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+FACTURA\s+ELECTRONICA/i,
      /(?:raz[oó]n\s+social|emisor|proveedor)\s*[:\-]\s*([^\n]+)/i,
    ]) || undefined;

  const folio =
    matchOne([
      /FACTURA\s+ELECTRONICA\s*(?:N[°º#]\s*|No\.?\s*)?([0-9]{1,10})/i,
      /\bN[°º#]\s*([0-9]{1,10})\b/i,
      /\bNo\.?\s*([0-9]{1,10})\b/i,
    ]) || undefined;

  const fechaStr =
    matchOne([
      /Fecha\s*Emisi[oó]n\s*[:\-]\s*([^\n]+)/i,
      /\bEmisi[oó]n\s*[:\-]\s*([^\n]+)/i,
      /Fecha\s*[:\-]\s*([^\n]+)/i,
    ]);
  const fechaEmision = toDateMaybe(fechaStr);

  const neto = matchLastNum([
    /MONTO\s+NETO\s*[$:]?\s*([0-9\.\,]+)/i,
    /\bNETO\s*[$:]?\s*([0-9\.\,]+)/i,
    /\bSUBTOTAL\s*[$:]?\s*([0-9\.\,]+)/i
  ]);
  const iva  = matchLastNum([
    /I\.?V\.?A\.?(?:\s*\d{1,2}%|)\s*[$:]?\s*([0-9\.\,]+)/i,
    /IMPUESTO\s*(?:ADICIONAL|IVA)\s*[$:]?\s*([0-9\.\,]+)/i
  ]);
  const total= matchLastNum([
    /TOTAL\s*(?:FACTURA|A\s*PAGAR|GENERAL|)\s*[$:]?\s*([0-9\.\,]+)/i,
    /MONTO\s*TOTAL\s*[$:]?\s*([0-9\.\,]+)/i
  ]);

  return { proveedor, folio, fechaEmision, neto, iva, total };
}

export default function PdfUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) return setError('Selecciona un archivo PDF antes de continuar.');
    if (file.type && file.type !== 'application/pdf' && !file.name.endsWith('.pdf'))
      return setError('Solo se permiten archivos PDF.');
    if (!name.trim()) return setError('Debes ingresar un título para la factura.');

    setLoading(true);

    try {
      // ⬇️ 1) extraer en el navegador
      const meta = await extractInBrowser(file);

      // ⬇️ 2) enviar archivo + metadatos al backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name.trim());
      if (meta.proveedor) formData.append('proveedor', meta.proveedor);
      if (meta.folio) formData.append('folio', meta.folio);
      if (meta.fechaEmision) formData.append('fechaEmision', meta.fechaEmision);
      if (typeof meta.neto === 'number') formData.append('neto', String(meta.neto));
      if (typeof meta.iva === 'number') formData.append('iva', String(meta.iva));
      if (typeof meta.total === 'number') formData.append('total', String(meta.total));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo');

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

        {response && response.url && (
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
            />

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
