// src/app/api/pdf/[id]/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop(); // 👈 id desde la URL

    if (!id) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
    }

    const deleted = await Pdf.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // 🔥 CORRECTO: eliminar desde blob storage
    const blobUrl = deleted.url;
    const blobPath = new URL(blobUrl).pathname.slice(1); // sin "/"
    await del(blobPath);

    return NextResponse.redirect(new URL('/facturas', req.url));
  } catch (err) {
    console.error('❌ Error al eliminar PDF o Blob:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
