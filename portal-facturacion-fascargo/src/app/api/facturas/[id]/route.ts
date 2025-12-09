// src/app/api/facturas/[id]/route.ts
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { connectToDatabase } from '@/lib/mongodb'; // O usa tu importación habitual
import { Pdf } from '@/models/Pdf';
import { isAdminEmail } from '@/lib/admin'; // Si no tienes esto, borra la validación de admin abajo

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const update: any = {};

    // Actualizar Fecha Vencimiento (con hora)
    if (body.fechaVencimiento !== undefined) {
      update.fechaVencimiento = body.fechaVencimiento ? new Date(body.fechaVencimiento) : null;
    }

    // Actualizar Estado
    if (body.estadoPago) update.estadoPago = body.estadoPago;

    const doc = await Pdf.findByIdAndUpdate(id, update, { new: true });
    
    if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    
    return NextResponse.json(doc);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error server' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Pega aquí la lógica de DELETE que te pasé antes si la necesitas, 
  // o usa la que ya tenías en tus otras APIs.
  // Por ahora lo urgente es el PATCH.
  return NextResponse.json({ message: 'OK' }); 
}