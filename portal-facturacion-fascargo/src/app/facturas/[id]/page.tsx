import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';

// Next.js proporciona los parámetros directamente como prop "params"
export default async function VerFacturaPage({
  params,
}: {
  params: { id: string };
}) {
  // Conectar a MongoDB
  await connectToDatabase();

  // Extraer ID desde los parámetros
  const { id } = params;

  // Buscar el PDF por ID en MongoDB
  const pdf = await Pdf.findById(id);

  // Si no se encuentra, retornar 404
  if (!pdf) return notFound();

  // Mostrar la factura PDF en un iframe
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
