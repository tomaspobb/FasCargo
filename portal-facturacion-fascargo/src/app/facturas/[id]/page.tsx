import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';

// Next.js automáticamente provee `params` como prop
export default async function VerFacturaPage({ params }: { params: { id: string } }) {
  // Conectar a la base de datos
  await connectToDatabase();

  // Obtener el ID de la URL
  const id = params.id;

  // Buscar PDF por ID
  const pdf = await Pdf.findById(id);

  // Si no se encuentra, mostrar 404
  if (!pdf) return notFound();

  // Renderizar
  return (
    <div className="container mt-4">
      <h3 className="mb-3">🧾 Visualizar Factura</h3>
      <p><strong>Archivo:</strong> {pdf.url.split('/').pop()}</p>
      <p><strong>Subido el:</strong> {new Date(pdf.createdAt).toLocaleString()}</p>
      <iframe
        src={pdf.url}
        width="100%"
        height="700px"
        style={{ border: '1px solid #ccc' }}
        title="Factura PDF"
      />
    </div>
  );
}
