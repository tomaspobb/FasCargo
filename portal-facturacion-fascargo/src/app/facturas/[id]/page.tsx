import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import Link from 'next/link';

// Este componente es completamente del lado del servidor
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // ✅ A partir de Next.js 15, params es una promesa y debe ser resuelta
  const { id } = await params;

  await connectToDatabase();

  const pdf = await Pdf.findById(id);

  if (!pdf) return notFound();

  const nombreFactura = pdf.title?.trim() || pdf.url.split('/').pop() || 'Factura';

  return (
    <main className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3">
      <div className="w-100" style={{ maxWidth: '900px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold text-primary">Visualizador de Factura</h1>
          <p className="text-secondary">
            A continuación puedes revisar el documento: <strong>{nombreFactura}</strong>
          </p>
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

          {/* Formulario clásico que envía POST a la API para eliminar */}
          <form action={`/api/pdf/${id}`} method="POST">
            <button type="submit" className="btn btn-danger">
              🗑️ Eliminar factura
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
