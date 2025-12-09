import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { DeletePdfButton } from '@/components/DeletePdfButton';
import { EditEstadoPago } from '@/components/EditEstadoPago';
import { EditFechaVencimiento } from '@/components/EditFechaVencimiento'; // <--- IMPORTACIÓN NUEVA

export const runtime = 'nodejs';

// Helpers seguros
function formatDateSafe(value?: unknown, locale: string = 'es-CL'): string {
  if (!value) return '—';
  const d =
    value instanceof Date
      ? value
      : new Date(typeof value === 'string' || typeof value === 'number' ? value : '');
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(locale);
}

function clp(n?: unknown, locale: string = 'es-CL'): string {
  return typeof n === 'number' ? `CLP ${n.toLocaleString(locale)}` : '—';
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // ✅ Evita el warning de Next: “params should be awaited…”
  const { id } = await params;

  await connectToDatabase();
  const pdf = await Pdf.findById(id);
  if (!pdf) return notFound();

  const nombreFactura =
    pdf.title?.trim() ||
    pdf.proveedor?.trim() ||
    (typeof pdf.url === 'string' ? pdf.url.split('/').pop() : '') ||
    'Factura';

  return (
    <main className="container py-5">
      {/* Encabezado */}
      <div className="mb-4 text-center">
        <h1 className="fw-bold text-primary mb-2">{nombreFactura}</h1>
        <p className="text-muted">Visualiza los detalles de la factura y su documento PDF.</p>
      </div>

      {/* Panel resumen */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
        <div className="row g-3 text-center align-items-center">
          <div className="col-md-2">
            <div className="fw-semibold text-muted small">Proveedor</div>
            <div>{pdf.proveedor || '—'}</div>
          </div>
          <div className="col-md-2">
            <div className="fw-semibold text-muted small">Folio</div>
            <div>{pdf.folio || '—'}</div>
          </div>
          <div className="col-md-2">
            <div className="fw-semibold text-muted small">Emisión</div>
            <div>{formatDateSafe(pdf.fechaEmision)}</div>
          </div>
          
          {/* === COLUMNA NUEVA: VENCIMIENTO EDITABLE === */}
          <div className="col-md-2">
            <div className="fw-semibold text-primary small">Vencimiento</div>
            <EditFechaVencimiento id={id} initial={pdf.fechaVencimiento} />
          </div>
          {/* =========================================== */}

          <div className="col-md-2">
            <div className="fw-semibold text-muted small">Estado</div>
            <EditEstadoPago id={id} initial={pdf.estadoPago} />
          </div>
          <div className="col-md-2">
            <div className="fw-semibold text-muted small">Subida</div>
            <div>{formatDateSafe(pdf.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Totales */}
      <div className="row g-3 mb-4 text-center">
        {[
          { label: 'Neto', value: pdf.neto },
          { label: 'IVA', value: pdf.iva },
          { label: 'Total', value: pdf.total },
        ].map((item) => (
          <div key={item.label} className="col-md-4">
            <div className="p-3 bg-white rounded-4 shadow-sm">
              <div className="fw-semibold text-muted small">{item.label}</div>
              <div className="fs-5 fw-bold text-primary">{clp(item.value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Visualizador PDF */}
      <div className="shadow-sm rounded-4 overflow-hidden mb-4" style={{ height: '75vh' }}>
        <iframe
          src={typeof pdf.url === 'string' ? pdf.url : ''}
          width="100%"
          height="100%"
          title={nombreFactura}
          style={{ border: 'none' }}
        />
      </div>

      {/* Acciones */}
      <div className="text-center">
        <DeletePdfButton id={id} />
      </div>
    </main>
  );
}