import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Buscar y eliminar el documento
    const deleted = await Pdf.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Extraer la URL del blob
    const blobUrl = deleted.url as string;

    // Obtener la clave del blob desde la URL
    // Ejemplo: https://<blob-id>.vercel-storage.com/pdfs/archivo.pdf → pdfs/archivo.pdf
    const parts = blobUrl.split('/');
    const blobKey = `${parts.at(-2)}/${parts.at(-1)}`;

    // Borrar del blob storage
    await del(blobKey);

    console.log(`🗑️ Blob eliminado: ${blobKey}`);
    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (err) {
    console.error('⛔ Error al eliminar factura:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
