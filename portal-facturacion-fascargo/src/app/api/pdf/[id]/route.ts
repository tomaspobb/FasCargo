// src/app/api/pdf/[id]/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ✅ PATCH: actualizar estadoPago, título o carpeta
export async function PATCH(req: Request, { params }: any) {
  try {
    await connectToDatabase();
    const id = params?.id as string | undefined;
    const body = await req.json().catch(() => ({}));

    if (!id) return NextResponse.json({ error: 'ID no válido' }, { status: 400 });

    const update: any = {};

    // título
    if (typeof body.title === 'string' && body.title.trim()) {
      update.title = body.title.trim();
    }

    // estadoPago
    if (typeof body.estadoPago === 'string') {
      const ok = ['pagada', 'pendiente', 'anulada', 'vencida'];
      if (!ok.includes(body.estadoPago)) {
        return NextResponse.json({ error: 'estadoPago inválido' }, { status: 400 });
      }
      update.estadoPago = body.estadoPago;
    }

    // carpeta
    if (body.folder !== undefined) {
      if (body.folder === null || body.folder === '') {
        update.folder = null;
      } else if (typeof body.folder === 'string') {
        update.folder = body.folder.trim().slice(0, 120);
      } else {
        return NextResponse.json({ error: 'folder inválido' }, { status: 400 });
      }
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
      folder: doc.folder || null,
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

// ✅ DELETE: elimina documento y su blob asociado (solo ADMIN)
export async function DELETE(req: Request, { params }: any) {
  try {
    await connectToDatabase();
    const id = params?.id as string | undefined;
    if (!id) return NextResponse.json({ error: 'ID no válido' }, { status: 400 });

    // 🔐 Autorización por correo
    const adminEmails = ['topoblete@alumnos.uai.cl', 'fascargo.chile.spa@gmail.com'];
    const requester = (req.headers.get('x-user-email') || '').trim().toLowerCase();
    if (!adminEmails.includes(requester)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const deleted = await Pdf.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

    // eliminar blob
    try {
      const blobPath = new URL(deleted.url).pathname.slice(1); // sin "/"
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
