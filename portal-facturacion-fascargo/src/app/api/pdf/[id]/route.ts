import { NextRequest } from 'next/server';
import { GridFS } from '@/lib/gridfs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const file = await GridFS.findOne(params.id);
    if (!file) {
      return new Response('Archivo no encontrado', { status: 404 });
    }

    const stream = await GridFS.read(params.id);

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${file.filename}"`,
      },
    });
  } catch (error) {
    console.error('Error al obtener el PDF:', error);
    return new Response('ID inválido o error interno', { status: 400 });
  }
}
