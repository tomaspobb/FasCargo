import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
    }

    const email = req.headers.get('x-user-email');
    if (email !== 'topoblete@alumnos.uai.cl') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const deleted = await Pdf.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const blobPath = new URL(deleted.url).pathname.slice(1);
    await del(blobPath);

    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar PDF o Blob:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
