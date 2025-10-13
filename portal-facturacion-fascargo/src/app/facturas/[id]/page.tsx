import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import Link from 'next/link';
import { DeletePdfButton } from '@/components/DeletePdfButton';

export const runtime = 'nodejs';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // 👇 await aquí
  const { id } = await params;

  await connectToDatabase();
  const pdf = await Pdf.findById(id);

  if (!pdf) return notFound();

  const nombreFactura =
    pdf.title?.trim() ||
    pdf.proveedor?.trim() ||
    pdf.url.split('/').pop() ||
    'Factura';

  return (
    <main className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3">
      <div className="w-100" style={{ maxWidth: '900px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold text-primary">Visualizador de Factura</h1>
          <p className="text-secondary">
            A continuación puedes revisar el documento: <strong>{nombreFactura}</strong>
          </p>
        </div>

        {/* Panel con datos (si existen) */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="p-3 bg-white border rounded-3 h-100">
              <div className="fw-semibold text-muted">Proveedor</div>
              <div>{pdf.proveedor || '—'}</div>
            </div>
          </div>
          <div className="col-md-3">
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
          <iframe
            src={pdf.url}
            width="100%"
            height="100%"
            title={nombreFactura}
            style={{ border: 'none', borderRadius: '0.5rem' }}
          />
        </div>

        <div className="text-center mt-4 d-flex justify-content-center gap-3 flex-wrap">
          <Link href="/facturas">
            <button className="btn btn-outline-primary">← Volver al listado</button>
          </Link>
          <DeletePdfButton id={id} />
        </div>
      </div>
    </main>
  );
}
