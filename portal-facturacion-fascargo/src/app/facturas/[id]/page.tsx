import { notFound, redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import Link from 'next/link';
import { ObjectId } from 'mongodb';

export default async function Page({ params }: { params: { id: string } }) {
  // Conectarse a la base de datos
  await connectToDatabase();

  // Buscar el PDF por su ID
  const pdf = await Pdf.findById(params.id);
  if (!pdf) return notFound();

  // Función para eliminar (llamará a la API DELETE del backend)
  const handleDelete = async () => {
    'use server';
    const res = await fetch(`/api/pdf/${params.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      redirect('/facturas'); // redirige al listado tras borrar
    } else {
      console.error('Error al eliminar la factura');
    }
  };

  return (
    <main className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3">
      <div className="w-100" style={{ maxWidth: '900px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold text-primary">Visualizador de Factura</h1>
          <p className="text-secondary">A continuación puedes revisar el documento cargado</p>
        </div>

        <div className="shadow border rounded overflow-hidden" style={{ height: '75vh' }}>
          <iframe
            src={pdf.url}
            width="100%"
            height="100%"
            title="Factura PDF"
            style={{
              border: 'none',
              borderRadius: '0.5rem',
            }}
          />
        </div>

        <div className="text-center mt-4 d-flex justify-content-center gap-3 flex-wrap">
          <Link href="/facturas">
            <button className="btn btn-outline-primary">← Volver al listado</button>
          </Link>

          {/* Botón de eliminar factura */}
          <form action={handleDelete}>
            <button type="submit" className="btn btn-danger">
              🗑️ Eliminar factura
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
