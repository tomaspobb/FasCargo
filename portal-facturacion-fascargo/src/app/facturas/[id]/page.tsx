import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';

export default async function Page({ params }: { params: { id: string } }) {
  // Conexión a la base de datos
  await connectToDatabase();

  // Buscar PDF por ID
  const pdf = await Pdf.findById(params.id);

  // Si no existe, mostrar 404
  if (!pdf) return notFound();

  // Obtener nombre limpio del archivo
  const fileName = decodeURIComponent(pdf.url.split('/').pop() || '').replace(/^\d+-/, '');

  // Renderizar vista
  return (
    <div className="container py-5">
      <div className="bg-white p-4 shadow rounded">
        <h2 className="mb-4 text-primary-emphasis">🧾 Visualización de Factura</h2>
        <p className="mb-2">
          <strong>Nombre del archivo:</strong>{' '}
          <span className="text-dark">{fileName}</span>
        </p>
        <p className="mb-4">
          <strong>Subido el:</strong>{' '}
          <span className="text-dark">{new Date(pdf.createdAt).toLocaleString()}</span>
        </p>
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
