import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const ADMIN_EMAIL = 'topoblete@alumnos.uai.cl';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } } // ✅ AQUÍ ESTABA EL ERROR
) {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
    }

    const userEmail = req.headers.get('x-user-email');
    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectToDatabase();

    const deleted = await Pdf.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    try {
      const blobPath = new URL(deleted.url).pathname.slice(1);
      await del(blobPath);
    } catch (err) {
      console.warn('⚠️ No se pudo eliminar el blob:', err);
    }

    return NextResponse.json({ message: 'Factura eliminada correctamente' });

  } catch (err) {
    console.error('❌ Error al eliminar PDF o blob:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
