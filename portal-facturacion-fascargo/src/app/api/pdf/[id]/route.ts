// src/app/api/pdf/[id]/route.ts

import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Asegúrate de que esta ruta sea correcta

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    // 🔐 Verifica si el usuario está autenticado y es el admin
    if (!session || session.user?.email !== 'topoblete@alumnos.uai.cl') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
    }

    const deleted = await Pdf.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    try {
      const blobPath = new URL(deleted.url).pathname.slice(1);
      await del(blobPath);
    } catch (err) {
      console.warn('⚠️ No se pudo eliminar el blob (puede que ya no exista):', err);
    }

    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar PDF o Blob:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
