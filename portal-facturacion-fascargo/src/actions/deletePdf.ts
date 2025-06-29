'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Esta función puede ser usada como <form action={deletePdfById}>
export async function deletePdfById(id: string) {
  try {
    await connectToDatabase();

    const deleted = await Pdf.findByIdAndDelete(id);
    if (!deleted) throw new Error('Factura no encontrada');

    revalidatePath('/facturas'); // Para que la lista se actualice
    redirect('/facturas');
  } catch (err) {
    console.error('❌ Error al eliminar PDF:', err);
    throw err;
  }
}
