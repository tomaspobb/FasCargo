import { put } from '@vercel/blob';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('📥 Procesando formulario');
    const formData = await req.formData();

    const file = formData.get('file') as File;

    if (!file) {
      console.log('⛔ No se recibió archivo');
      return NextResponse.json({ error: 'Archivo no recibido' }, { status: 400 });
    }

    console.log('📄 Archivo recibido:', file.name, file.type, file.size);

    const buffer = new Uint8Array(await file.arrayBuffer());

    console.log('📤 Subiendo a Vercel Blob...');
    const blob = await put(`pdfs/${file.name}`, buffer, {
      access: 'public',
      contentType: file.type,
    });

    console.log('✅ Subido a Blob. URL:', blob.url);

    console.log('🔌 Conectando a MongoDB...');
    await connectToDatabase();

    console.log('💾 Guardando URL en la base de datos...');
    const newPdf = await Pdf.create({
      url: blob.url,
      createdAt: new Date(),
    });

    console.log('✅ Guardado exitosamente:', newPdf);

    return NextResponse.json(newPdf);
  } catch (err: any) {
    console.error('⛔ Error al subir PDF:', err);
    return NextResponse.json(
      { error: err?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
