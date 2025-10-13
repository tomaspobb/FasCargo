import { put } from '@vercel/blob';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';
import { extractInvoiceForIPdf } from '@/lib/extractInvoice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = (formData.get('name') as string | null)?.trim() || '';
    const uploadedBy = (formData.get('uploadedBy') as string | null) || undefined;

    if (!file) return NextResponse.json({ error: 'Archivo no recibido' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Nombre no recibido' }, { status: 400 });
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten PDFs' }, { status: 415 });
    }

    const MAX = 25 * 1024 * 1024;
    if (file.size > MAX) {
      return NextResponse.json({ error: 'El PDF supera 25MB' }, { status: 413 });
    }

    // Obtener arrayBuffer una sola vez
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 🔎 Parseo con fallback: si falla, seguimos con extracted vacío
    let extracted: Awaited<ReturnType<typeof extractInvoiceForIPdf>> = {};
    try {
      extracted = await extractInvoiceForIPdf(uint8Array);
    } catch (e) {
      console.warn('⚠️ Falló extractInvoiceForIPdf:', e);
      extracted = {};
    }

    const safe = slugify(name) || 'factura';
    const objectName = `pdfs/${safe}-${Date.now()}.pdf`;

    const blob = await put(objectName, arrayBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      contentDisposition: `inline; filename="${safe}.pdf"`,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });

    await connectToDatabase();

    const estadoSistema: 'uploaded' | 'parsed' | 'validated' | 'rejected' =
      extracted.folio || extracted.total || extracted.proveedor ? 'parsed' : 'uploaded';

    const doc = await Pdf.create({
      title: name,
      url: blob.url,
      uploadedBy,
      estadoPago: 'pendiente',
      estadoSistema,
      folio: extracted.folio,
      proveedor: extracted.proveedor,
      fechaEmision: extracted.fechaEmision,
      neto: extracted.neto,
      iva: extracted.iva,
      total: extracted.total,
    });

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      url: doc.url,
      uploadedBy: doc.uploadedBy || null,
      estadoPago: doc.estadoPago,
      estadoSistema: doc.estadoSistema,
      folio: doc.folio,
      proveedor: doc.proveedor,
      fechaEmision: doc.fechaEmision,
      fechaPago: doc.fechaPago || null,
      neto: doc.neto,
      iva: doc.iva,
      total: doc.total,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err: any) {
    console.error('⛔ Error al subir PDF:', err);
    return NextResponse.json(
      { error: err?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}