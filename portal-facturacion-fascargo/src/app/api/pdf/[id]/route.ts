// src/app/api/pdf/[id]/route.ts

import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// Tipado correcto para App Router en Next.js 13+
interface Params {
  params: {
    id: string;
  };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();

    const id = params.id;
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
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
