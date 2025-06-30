import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Correo autorizado para borrar
const ADMIN_EMAIL = 'topoblete@alumnos.uai.cl';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = req.headers.get('x-user-email');

    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
    }

    const deleted = await Pdf.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Factura eliminada correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar PDF:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
