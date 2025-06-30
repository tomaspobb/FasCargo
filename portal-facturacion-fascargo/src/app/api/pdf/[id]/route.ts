// src/app/api/pdf/[id]/route.ts

import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

// ✅ DELETE: Elimina una factura y su blob asociado
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
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
      const blobPath = new URL(deleted.url).pathname.slice(1); // Quita "/"
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