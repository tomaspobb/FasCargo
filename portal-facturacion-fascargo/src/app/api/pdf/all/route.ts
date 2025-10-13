import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectToDatabase();

    const allPdfs = await Pdf.find().sort({ createdAt: -1 });

    const result = allPdfs.map((doc) => ({
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
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error al obtener PDFs:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
