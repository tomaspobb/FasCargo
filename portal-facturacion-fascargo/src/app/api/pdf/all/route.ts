// 📁 src/app/api/pdf/all/route.ts

import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();

    const allPdfs = await Pdf.find().sort({ createdAt: -1 });

    // Solo devolvemos los campos útiles para el frontend
    const result = allPdfs.map((doc) => ({
      id: doc._id,
      url: doc.url,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al obtener PDFs:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
