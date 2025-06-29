import { put } from '@vercel/blob';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('📥 Procesando formulario de carga');

    // Obtener los datos del formulario (archivo + nombre)
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    // Validar archivo recibido
    if (!file) {
      console.log('⛔ No se recibió archivo');
      return NextResponse.json({ error: 'Archivo no recibido' }, { status: 400 });
    }

    // Validar nombre proporcionado
    if (!name || typeof name !== 'string') {
      console.log('⛔ Nombre no proporcionado');
      return NextResponse.json({ error: 'Nombre no recibido' }, { status: 400 });
    }

    console.log('📄 Archivo recibido:', file.name, file.type, file.size);

    // ✅ Convertir directamente a ArrayBuffer (no Uint8Array)
    const arrayBuffer = await file.arrayBuffer();

    // Subir a Vercel Blob con acceso público
    console.log('📤 Subiendo a Vercel Blob...');
    const blob = await put(`pdfs/${file.name}`, arrayBuffer, {
      access: 'public',
      contentType: file.type,
    });

    console.log('✅ Subido a Blob. URL:', blob.url);

    // Conectar a la base de datos MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await connectToDatabase();

    // Guardar referencia del PDF en la base de datos
    console.log('💾 Guardando en la base de datos...');
    const newPdf = await Pdf.create({
      title: name.trim(), // Se guarda el nombre personalizado
      url: blob.url,
      createdAt: new Date(),
    });

    console.log('✅ Guardado exitosamente:', newPdf);

    // ⚠️ Aquí usamos .toObject() para devolver todos los campos
    return NextResponse.json(newPdf.toObject());

  } catch (err: any) {
    console.error('⛔ Error al subir PDF:', err);
    return NextResponse.json(
      { error: err?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
