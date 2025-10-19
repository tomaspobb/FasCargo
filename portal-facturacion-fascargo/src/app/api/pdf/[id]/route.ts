// src/app/api/pdf/[id]/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    if (!id) return NextResponse.json({ error: 'ID no válido' }, { status: 400 });

    const update: any = {};
    if (typeof body.title === 'string' && body.title.trim()) update.title = body.title.trim();
    if (typeof body.estadoPago === 'string') {
      const ok = ['pagada', 'pendiente', 'anulada', 'vencida'];
      if (!ok.includes(body.estadoPago)) {
        return NextResponse.json({ error: 'estadoPago inválido' }, { status: 400 });
      }
      update.estadoPago = body.estadoPago;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
    }

    const doc = await Pdf.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      url: doc.url,
      estadoPago: doc.estadoPago,
      estadoSistema: doc.estadoSistema,
      proveedor: doc.proveedor ?? null,
      folio: doc.folio ?? null,
      fechaEmision: doc.fechaEmision ?? null,
      neto: typeof doc.neto === 'number' ? doc.neto : null,
      iva: typeof doc.iva === 'number' ? doc.iva : null,
      total: typeof doc.total === 'number' ? doc.total : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error('❌ Error al actualizar factura:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// (tu DELETE queda igual aquí debajo)
