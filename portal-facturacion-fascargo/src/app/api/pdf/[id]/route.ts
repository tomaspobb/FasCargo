import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { isAdminEmail } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH: actualizar title, folderName y/o estadoPago
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Next 15: params es Promise
    if (!id) return NextResponse.json({ error: 'ID no válido' }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      folderName?: string | null;
      estadoPago?: 'pagada' | 'pendiente' | 'anulada' | 'vencida' | string;
    };

    await connectToDatabase();

    const update: Record<string, any> = {};

    // title (opcional)
    if (typeof body.title === 'string' && body.title.trim()) {
      update.title = body.title.trim();
    }

    // folderName (string | null | '')
    if (body.folderName !== undefined) {
      if (body.folderName === null) {
        update.folderName = null;
      } else if (typeof body.folderName === 'string') {
        const f = body.folderName.trim();
        update.folderName = f || null;
      }
    }

    // estadoPago (validado)
    if (typeof body.estadoPago === 'string') {
      const ok = ['pagada', 'pendiente', 'anulada', 'vencida'] as const;
      if (!ok.includes(body.estadoPago as any)) {
        return NextResponse.json({ error: 'estadoPago inválido' }, { status: 400 });
      }
      update.estadoPago = body.estadoPago;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
    }

    const doc = await Pdf.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!doc) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      url: doc.url,
      folderName: doc.folderName ?? null,
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

// DELETE: elimina doc y blob (solo admin)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Next 15: params es Promise
    if (!id) return NextResponse.json({ error: 'ID no válido' }, { status: 400 });

    await connectToDatabase();

    // Valida admin a partir de header "x-user-email" (la UI debe enviarlo)
    const requester = (req.headers.get('x-user-email') || '').trim().toLowerCase();
    if (!isAdminEmail(requester)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const deleted = await Pdf.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

    // Borra el blob; acepta URL completa
    try {
      if (deleted.url) await del(deleted.url);
    } catch (err) {
      console.warn('⚠️ No se pudo eliminar el blob (puede que ya no exista):', err);
    }

    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar PDF o Blob:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
