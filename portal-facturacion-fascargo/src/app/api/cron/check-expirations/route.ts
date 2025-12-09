import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { sendExpirationAlert } from '@/lib/email'; // Importamos la versión bonita

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("🟢 1. Iniciando cron de revisión (Versión Full)...");
    await connectToDatabase(); 

    // Buscar facturas con fecha válida y no pagadas
    const facturas = await Pdf.find({ 
      fechaVencimiento: { $exists: true, $ne: null },
      estadoPago: { $ne: 'pagada' } 
    });

    console.log(`🟢 2. Facturas encontradas en BD: ${facturas.length}`);

    const now = new Date();
    let correosEnviados = 0;
    let logDetallado: string[] = [];

    for (const factura of facturas) {
      if (!factura.fechaVencimiento) continue;

      const vencimiento = new Date(factura.fechaVencimiento);
      const diffTime = vencimiento.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24); // Diferencia en días

      console.log(`   👉 Factura "${factura.title}" vence en: ${diffDays.toFixed(2)} días`);

      // LÓGICA DE AVISO:
      // Avisa si falta 1 semana o menos (diffDays <= 7)
      // Y si todavía no ha pasado más de 1 día de vencida (diffDays > -1)
      if (diffDays <= 7 && diffDays > -1) {
        
        // ⚠️ IMPORTANTE: Aquí puedes forzar tu correo personal para la demo
        // Si lo dejas vacío, intentará usar el 'uploadedBy' o el del sistema
        const destinatario = "fascargo.chile.spa@gmail.com"; 

        if (destinatario) {
          console.log(`   🚀 Enviando alerta a: ${destinatario}`);

          // === AQUÍ ESTÁ LA MAGIA ===
          // Pasamos el ID real (_id) para el link, y el title para el texto
          const enviado = await sendExpirationAlert(
            destinatario,
            factura._id.toString(), // <--- ESTO ARREGLA EL ERROR DEL LINK
            factura.title,
            diffDays,
            vencimiento
          );

          if (enviado) {
            correosEnviados++;
            logDetallado.push(`Enviado a ${destinatario} por factura ${factura.title}`);
          }
        }
      } else {
        console.log("   ⏸️ No cumple condición de fecha para alerta.");
      }
    }

    return NextResponse.json({ 
      message: 'Revisión completada con éxito', 
      facturasRevisadas: facturas.length,
      correosEnviados,
      detalle: logDetallado
    });

  } catch (error) {
    console.error("❌ Error en cron:", error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error }, { status: 500 });
  }
}