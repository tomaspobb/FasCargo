// src/app/api/cron/check-expirations/route.ts
import { NextResponse } from 'next/server';
// Asegúrate de que tu archivo de conexión se llame 'mongodb.ts' dentro de 'src/lib'. 
// Si se llama 'db.ts' o 'mongoose.ts', cambia la palabra 'mongodb' por el nombre correcto.
import { connectToDatabase } from '@/lib/mongodb'; 
import { Pdf } from '@/models/Pdf'; 
import { sendExpirationAlert } from '@/lib/email';

export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // 1. Conectar a DB (Usando el nombre correcto importado arriba)
    await connectToDatabase(); 

    console.log("Iniciando revisión de vencimientos...");
    
    // 2. Buscar facturas con fecha de vencimiento y que no estén pagadas
    const facturas = await Pdf.find({ 
      fechaVencimiento: { $exists: true, $ne: null },
      estadoPago: { $ne: 'pagada' } 
    });

    const now = new Date();
    let correosEnviados = 0;

    for (const factura of facturas) {
      if (!factura.fechaVencimiento) continue;

      const vencimiento = new Date(factura.fechaVencimiento);
      // Calcular diferencia en milisegundos y pasar a días
      const diffTime = vencimiento.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      console.log(`Factura ${factura.title}: vence en ${diffDays.toFixed(1)} días`);

      // Lógica de Notificación:
      // Avisa si queda entre 0 y 7 días.
      // (diffDays > -0.5 permite que avise incluso si venció hace unas horas hoy mismo)
      if (diffDays <= 7 && diffDays > -0.5) {
        
        // Usamos el mail del uploader o el de la empresa por defecto
        const destinatario = factura.uploadedBy || process.env.GMAIL_USER || "";
        
        if (destinatario) {
          console.log(`Enviando correo a: ${destinatario}`);
          await sendExpirationAlert(destinatario, factura.title, diffDays, vencimiento);
          correosEnviados++;
        }
      }
    }

    return NextResponse.json({ 
      message: 'Revisión completada', 
      facturasRevisadas: facturas.length,
      correosEnviados 
    });

  } catch (error) {
    console.error("Error en cron:", error);
    return NextResponse.json({ error: 'Error en el proceso de revisión' }, { status: 500 });
  }
}