import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';

// Definimos el componente como async y desestructuramos directamente params
export default async function Page({ params }: { params: { id: string } }) {
  // Conectar a la base de datos
  await connectToDatabase();

  // Buscar el documento por ID
  const pdf = await Pdf.findById(params.id);

  // Si no se encuentra, lanzar 404
  if (!pdf) return notFound();

  // Limpiar nombre de archivo (eliminar timestamp o hash si existe)
  const fileName = decodeURIComponent(pdf.url.split('/').pop() || '').replace(/^\d+[-_]/, '');

  // Renderizado visual
  return (
    <div className="container py-5">
      <div className="bg-white p-4 shadow rounded">
        <h2 className="mb-4 text-primary-emphasis">🧾 Visualización de Factura</h2>
        <p><strong>Nombre del archivo:</strong> <span className="text-dark">{fileName}</span></p>
        <p><strong>Subido el:</strong> <span className="text-dark">{new Date(pdf.createdAt).toLocaleString()}</span></p>
        <iframe
          src={pdf.url}
          width="100%"
          height="700px"
          style={{ border: '1px solid #ccc', borderRadius: '8px' }}
          title="Factura PDF"
        />
      </div>
    </div>
  );
}
