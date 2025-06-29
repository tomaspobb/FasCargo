import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';

type Props = {
  params: {
    id: string;
  };
};

export default async function Page(props: Props) {
  const { id } = await props.params; // 👈 await aquí según Next.js 15

  await connectToDatabase();

  const pdf = await Pdf.findById(id);

  if (!pdf) return notFound();

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
