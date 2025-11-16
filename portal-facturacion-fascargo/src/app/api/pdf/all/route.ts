// src/app/api/pdf/all/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    // Trae solo campos necesarios y asegura folderName
    const docs = await Pdf.find({}, null, { sort: { createdAt: -1 } }).lean();

    const out = (docs || []).map((d: any) => ({
      id: String(d._id),
      title: d.title ?? '',
      url: d.url ?? '',
      // 👇 clave para que aparezca la carpeta correcta
      folderName: d.folderName ?? null,
      estadoPago: d.estadoPago ?? 'pendiente',
      estadoSistema: d.estadoSistema ?? 'uploaded',
      proveedor: d.proveedor ?? null,
      folio: d.folio ?? null,
      neto: typeof d.neto === 'number' ? d.neto : null,
      iva: typeof d.iva === 'number' ? d.iva : null,
      total: typeof d.total === 'number' ? d.total : null,
      fechaEmision: d.fechaEmision ?? null,
      createdAt: d.createdAt ?? null,
      updatedAt: d.updatedAt ?? null,
    }));

    return NextResponse.json(out);
  } catch (err) {
    console.error('❌ /api/pdf/all error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
