// 📁 src/app/api/pdf/[id]/route.ts

import { NextRequest } from 'next/server';
import { Attachment } from '@/lib/gridfs';
import { Types } from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = new Types.ObjectId(params.id);

    const file = await Attachment.findOne({ _id: id });

    if (!file) {
      return new Response('Archivo no encontrado', { status: 404 });
    }

    const stream = await Attachment.read({ _id: id });

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${file.filename || 'archivo.pdf'}"`,
      },
    });
  } catch (error) {
    console.error('Error al obtener el PDF:', error);
    return new Response('ID inválido o error interno', { status: 400 });
  }
}
