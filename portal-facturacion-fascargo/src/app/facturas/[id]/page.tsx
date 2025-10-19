import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import Link from 'next/link';
import { DeletePdfButton } from '@/components/DeletePdfButton';
import { EditEstadoPago } from '@/components/EditEstadoPago';

export const runtime = 'nodejs';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const pdf = await Pdf.findById(id);
  if (!pdf) return notFound();

  const nombreFactura = pdf.title?.trim() || pdf.proveedor?.trim() || pdf.url.split('/').pop() || 'Factura';

  return (
    <main className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3">
      <div className="w-100" style={{ maxWidth: '1000px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="fw-bold text-primary m-0">Visualizador de Factura</h1>
          <div className="d-flex gap-2">
            <Link href="/dashboard" className="btn btn-outline-secondary">← Dashboard</Link>
            <Link href="/facturas" className="btn btn-outline-primary">← Listado</Link>
          </div>
        </div>
        <p className="text-secondary mb-4">
          Documento: <strong>{nombreFactura}</strong>
        </p>

        {/* Panel datos + editor estado */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">Proveedor</div>
              <div>{pdf.proveedor || '—'}</div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">Folio</div>
              <div>{pdf.folio || '—'}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">Emisión</div>
              <div>{pdf.fechaEmision ? new Date(pdf.fechaEmision).toLocaleDateString() : '—'}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">Estado de pago</div>
              <EditEstadoPago id={id} initial={pdf.estadoPago} />
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">Neto</div>
              <div>{typeof pdf.neto === 'number' ? `CLP ${pdf.neto.toLocaleString()}` : '—'}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">IVA</div>
              <div>{typeof pdf.iva === 'number' ? `CLP ${pdf.iva.toLocaleString()}` : '—'}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">Total</div>
              <div>{typeof pdf.total === 'number' ? `CLP ${pdf.total.toLocaleString()}` : '—'}</div>
            </div>
          </div>
        </div>

        <div className="shadow border rounded overflow-hidden" style={{ height: '75vh' }}>
          <iframe src={pdf.url} width="100%" height="100%" title={nombreFactura} style={{ border: 'none' }} />
        </div>

        <div className="text-center mt-4 d-flex justify-content-center gap-3 flex-wrap">
          <DeletePdfButton id={id} />
        </div>
      </div>
    </main>
  );
}
