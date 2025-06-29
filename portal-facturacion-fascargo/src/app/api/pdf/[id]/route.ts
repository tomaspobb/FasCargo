import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Conectar a la base de datos
    await connectToDatabase();

    // 2. Buscar el PDF por ID
    const pdf = await Pdf.findById(params.id);
    if (!pdf) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // 3. Eliminar el archivo del Blob de Vercel
    const blobPath = new URL(pdf.url).pathname.slice(1); // quita la "/" del inicio
    await del(blobPath); // Ejemplo: pdfs/F926.pdf

    // 4. Eliminar el documento de MongoDB
    await Pdf.findByIdAndDelete(params.id);

    // 5. Redirigir
    return NextResponse.redirect(new URL('/facturas', req.url));
  } catch (err) {
    console.error('❌ Error al eliminar factura:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
