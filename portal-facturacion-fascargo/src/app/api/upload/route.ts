// 📁 src/app/api/pdf/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { conn, Attachment } from '@/lib/gridfs'; // Asegúrate de haber creado esto
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;

    // ⛔ Validación del archivo
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    // 📦 Convertir a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 📚 Conexión a MongoDB
    await connectToDatabase();

    // 💾 Guardar en GridFS
    const writeStream = await Attachment.write(
      {
        filename: file.name,
        contentType: file.type,
      },
      buffer
    );

    // 🔗 Guardar referencia en colección Pdf
    const url = `/api/pdf/${writeStream.id}`; // Ruta donde lo puedes visualizar
    const doc = await Pdf.create({ url });

    // ✅ Devolver metadata
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error al subir PDF:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
