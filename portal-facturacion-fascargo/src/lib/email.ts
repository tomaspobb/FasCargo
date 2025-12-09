import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendExpirationAlert = async (
  to: string, 
  invoiceId: string,    // ID para el link (ej: 65a...)
  invoiceTitle: string, // Título para leer (ej: NC 34812)
  daysLeft: number, 
  expirationDate: Date
) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString('es-CL');
  
  // Lógica de colores y textos según urgencia
  let subject = `⚠️ Aviso: Factura "${invoiceTitle}" por vencer`;
  let colorHeader = '#0d6efd'; // Azul Fast Cargo
  let urgencyTitle = 'Recordatorio de Vencimiento';
  let urgencyMessage = `La factura <strong>${invoiceTitle}</strong> está próxima a vencer.`;

  if (daysLeft <= 1) {
    subject = `🚨 URGENTE: "${invoiceTitle}" vence en menos de 24 horas`;
    colorHeader = '#dc3545'; // Rojo Alerta
    urgencyTitle = '⚠️ ALERTA DE VENCIMIENTO INMINENTE';
    urgencyMessage = `ATENCIÓN: La factura <strong>${invoiceTitle}</strong> requiere gestión inmediata.`;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      
      <div style="background-color: ${colorHeader}; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${urgencyTitle}</h1>
        <p style="color: #e0e0e0; margin: 5px 0 0 0;">Portal Fast Cargo</p>
      </div>

      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #333;">Hola,</p>
        <p style="font-size: 16px; color: #333;">${urgencyMessage}</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${colorHeader};">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;">📄 <strong>Documento:</strong> ${invoiceTitle}</li>
            <li style="margin-bottom: 8px;">📅 <strong>Vence el:</strong> ${formattedDate}</li>
            <li style="margin-bottom: 0;">⏳ <strong>Tiempo restante:</strong> ${daysLeft.toFixed(1)} días</li>
          </ul>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/facturas/${invoiceId}" 
             style="background-color: ${colorHeader}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Ir a la Factura
          </a>
        </p>
      </div>

      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">© 2025 Fast Cargo Chile SpA. Todos los derechos reservados.</p>
        <p style="margin: 5px 0 0 0;">Este es un mensaje automático.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Portal Fast Cargo" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ Correo enviado correctamente para: ${invoiceTitle}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return false;
  }
};