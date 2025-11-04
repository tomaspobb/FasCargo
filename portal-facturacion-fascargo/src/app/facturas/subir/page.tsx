'use client';

import { useState, useRef } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Worker de pdf.js
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

  const proveedor = matchOne([
    /([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+R\.?U\.?T\.?/i,
    /([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+FACTURA\s+ELECTRONICA/i,
    /(?:raz[oó]n\s+social|emisor|proveedor)\s*[:\-]\s*([^\n]+)/i,
  ]) || undefined;

  const folio = matchOne([
    /FACTURA\s+ELECTRONICA\s*(?:N[°º#]\s*|No\.?\s*)?([0-9]{1,10})/i,
    /\bN[°º#]\s*([0-9]{1,10})\b/i,
    /\bNo\.?\s*([0-9]{1,10})\b/i,
  ]) || undefined;

  const fechaStr = matchOne([
    /Fecha\s*Emisi[oó]n\s*[:\-]\s*([^\n]+)/i,
    /\bEmisi[oó]n\s*[:\-]\s*([^\n]+)/i,
    /Fecha\s*[:\-]\s*([^\n]+)/i,
  ]);
  const fechaEmision = toDateMaybe(fechaStr);

  const neto  = matchLastNum([/MONTO\s+NETO\s*[$:]?\s*([0-9\.\,]+)/i, /\bNETO\s*[$:]?\s*([0-9\.\,]+)/i, /\bSUBTOTAL\s*[$:]?\s*([0-9\.\,]+)/i]);
  const iva   = matchLastNum([/I\.?V\.?A\.?(?:\s*\d{1,2}%|)\s*[$:]?\s*([0-9\.\,]+)/i, /IMPUESTO\s*(?:ADICIONAL|IVA)\s*[$:]?\s*([0-9\.\,]+)/i]);
  const total = matchLastNum([/TOTAL\s*(?:FACTURA|A\s*PAGAR|GENERAL|)\s*[$:]?\s*([0-9\.\,]+)/i, /MONTO\s*TOTAL\s*[$:]?\s*([0-9\.\,]+)/i]);

  return { proveedor, folio, fechaEmision, neto, iva, total };
}

export default function PdfUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [meta, setMeta] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) await onPickFile(f);
  };
  const onPickFile = async (f: File) => {
    if (f.type && f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      setError('Solo se permiten archivos PDF.');
      return;
    }
    setError(null);
    setFile(f);
    setMeta(null);
    try {
      const m = await extractInBrowser(f);
      setMeta(m);
      if (!name.trim()) setName(f.name.replace(/\.pdf$/i, ''));
    } catch (err: any) {
      console.error(err);
      setMeta(null);
      setError('No se pudo leer el PDF en el navegador.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError('Selecciona un archivo PDF antes de continuar.');
    if (!name.trim()) return setError('Debes ingresar un título para la factura.');

    setLoading(true);
    setProgress(15);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name.trim());
      if (meta?.proveedor) formData.append('proveedor', meta.proveedor);
      if (meta?.folio) formData.append('folio', meta.folio);
      if (meta?.fechaEmision) formData.append('fechaEmision', meta.fechaEmision);
      if (typeof meta?.neto === 'number') formData.append('neto', String(meta.neto));
      if (typeof meta?.iva === 'number') formData.append('iva', String(meta.iva));
      if (typeof meta?.total === 'number') formData.append('total', String(meta.total));

      setProgress(45);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      setProgress(85);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo');

      setResponse(data);
      setProgress(100);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir el archivo');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold text-primary mb-3">📤 Subir nueva factura PDF</h2>

      <div className="bg-white p-4 rounded-4 shadow-sm">
        {/* Dropzone */}
        <div
          ref={dropRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border border-2 border-dashed rounded-4 p-4 text-center mb-3"
          style={{ borderStyle: 'dashed' }}
        >
          <div className="mb-2">
            <i className="bi bi-cloud-arrow-up fs-1 text-primary" />
          </div>
          <div className="mb-2">Arrastra un PDF aquí, o selecciónalo manualmente.</div>
          <label className="btn btn-outline-primary rounded-pill px-4">
            Seleccionar archivo
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])}
              hidden
            />
          </label>
          {file && (
            <div className="mt-2 small text-muted">
              Archivo seleccionado: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
            </div>
          )}
        </div>

        <form onSubmit={handleUpload} className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Título de la factura</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              placeholder="Ej: Transporte Leis Alejandro (Sep 2025)"
              disabled={loading}
              required
            />
          </div>

        {/* Metadatos */}
          <div className="col-12">
            <div className="bg-light rounded-3 p-3">
              <div className="fw-semibold mb-2">Metadatos detectados:</div>
              <div className="row g-2 small">
                <div className="col-sm-4"><strong>Proveedor:</strong> {meta?.proveedor || '—'}</div>
                <div className="col-sm-4"><strong>Folio:</strong> {meta?.folio || '—'}</div>
                <div className="col-sm-4"><strong>Emisión:</strong> {meta?.fechaEmision ? new Date(meta.fechaEmision).toLocaleDateString() : '—'}</div>
                <div className="col-sm-4"><strong>Neto:</strong> {typeof meta?.neto === 'number' ? meta.neto.toLocaleString() : '—'}</div>
                <div className="col-sm-4"><strong>IVA:</strong> {typeof meta?.iva === 'number' ? meta.iva.toLocaleString() : '—'}</div>
                <div className="col-sm-4"><strong>Total:</strong> {typeof meta?.total === 'number' ? meta.total.toLocaleString() : '—'}</div>
              </div>
            </div>
          </div>

          {error && <div className="col-12"><div className="alert alert-danger rounded-3">{error}</div></div>}

          {loading && (
            <div className="col-12">
              <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${progress}%` }}>{progress}%</div>
              </div>
            </div>
          )}

          <div className="col-12">
            <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={loading || !file}>
              {loading ? 'Subiendo…' : 'Subir PDF'}
            </button>
          </div>
        </form>

        {response?.url && (
          <div className="mt-4">
            <div className="alert alert-success rounded-4 p-3 shadow-sm">
              <h6 className="fw-bold mb-1">✅ PDF subido correctamente</h6>
              <div className="small">
                <div><strong>Título:</strong> {response.title}</div>
                <div><strong>Subido el:</strong> {new Date(response.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <iframe
              src={response.url}
              width="100%"
              height="480"
              style={{ border: '1px solid #ddd', borderRadius: 12 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
