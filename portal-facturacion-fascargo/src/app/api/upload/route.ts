// src/app/api/upload/route.ts
import { put } from '@vercel/blob';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';

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

function toNum(v: FormDataEntryValue | null) {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(v: FormDataEntryValue | null) {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // Título visible (obligatorio)
    const rawName = (formData.get('name') as string | null) ?? '';
    const name = rawName.trim();
    const uploadedBy = (formData.get('uploadedBy') as string | null) || undefined;

    // Modo de carpeta y nombre (opcional)
    const folderModeRaw = (formData.get('folderMode') as string | null) || 'auto';
    const folderMode = ['auto', 'new', 'existing'].includes(folderModeRaw) ? folderModeRaw : 'auto';

    const folderNameRaw = (formData.get('folderName') as string | null) ?? null;
    const folderName =
      folderMode === 'auto'
        ? null
        : folderNameRaw && folderNameRaw.trim() ? folderNameRaw.trim() : null;

    if (!file) {
      return NextResponse.json({ error: 'Archivo no recibido' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Nombre no recibido' }, { status: 400 });
    }

    // PDF check (acepta tipo vacío si la extensión es .pdf)
    const isPdfMime = file.type === 'application/pdf';
    const isPdfName = /\.pdf$/i.test(file.name || '');
    if (!isPdfMime && !isPdfName) {
      return NextResponse.json({ error: 'Solo se permiten PDFs' }, { status: 415 });
    }

    // Límite de tamaño (25MB)
    const MAX = 25 * 1024 * 1024;
    if (file.size > MAX) {
      return NextResponse.json({ error: 'El PDF supera 25MB' }, { status: 413 });
    }

    // Metadatos opcionales parseados por el front
    const proveedor = (formData.get('proveedor') as string | null)?.trim() || undefined;
    const folio = (formData.get('folio') as string | null)?.trim() || undefined;
    const neto = toNum(formData.get('neto'));
    const iva = toNum(formData.get('iva'));
    const total = toNum(formData.get('total'));
    const fechaEmision = toDate(formData.get('fechaEmision'));
    
    // === NUEVO: Recibimos la fecha de vencimiento ===
    const fechaVencimiento = toDate(formData.get('fechaVencimiento'));

    // Subir a Blob (nombre estable con timestamp)
    const arrayBuffer = await file.arrayBuffer();
    const safe = slugify(name) || 'factura';
    const objectName = `pdfs/${safe}-${Date.now()}.pdf`;

    const blob = await put(objectName, arrayBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });

    // Guardar en Mongo
    await connectToDatabase();

    const estadoSistema: 'uploaded' | 'parsed' | 'validated' | 'rejected' =
      proveedor || folio || neto != null || iva != null || total != null || fechaEmision
        ? 'parsed'
        : 'uploaded';

    const doc = await Pdf.create({
      title: name,
      url: blob.url,
      uploadedBy,
      // 👇 guarda carpeta elegida/creada; null si automática
      folderName,
      estadoPago: 'pendiente',
      estadoSistema,
      proveedor,
      folio,
      neto,
      iva,
      total,
      fechaEmision,
      fechaVencimiento, // <--- Guardamos el nuevo campo
    });

    // Respuesta uniforme (incluye folderName para que el front lo muestre)
    return NextResponse.json(
      {
        id: doc._id.toString(),
        title: doc.title,
        url: doc.url,
        uploadedBy: doc.uploadedBy || null,
        folderName: doc.folderName || null,
        estadoPago: doc.estadoPago,
        estadoSistema: doc.estadoSistema,
        proveedor: doc.proveedor || null,
        folio: doc.folio || null,
        neto: typeof doc.neto === 'number' ? doc.neto : null,
        iva: typeof doc.iva === 'number' ? doc.iva : null,
        total: typeof doc.total === 'number' ? doc.total : null,
        fechaEmision: doc.fechaEmision || null,
        fechaVencimiento: doc.fechaVencimiento || null, // <--- Devolvemos el campo
        fechaPago: doc.fechaPago || null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('⛔ Error al subir PDF:', err);
    return NextResponse.json(
      { error: err?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}