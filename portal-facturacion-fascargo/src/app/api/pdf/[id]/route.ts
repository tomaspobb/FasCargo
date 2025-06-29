// src/app/api/pdf/[id]/route.ts

import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob'; // 👈 Importa la función para eliminar

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const deleted = await Pdf.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Eliminar el archivo del Blob
    const blobUrl = deleted.url;
    const blobPath = new URL(blobUrl).pathname; // obtiene "/nombre.pdf"

    await del(blobPath); // 👈 borra el blob del almacenamiento

    return NextResponse.redirect(new URL('/facturas', req.url));
  } catch (err) {
    console.error('❌ Error al eliminar PDF o Blob:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
