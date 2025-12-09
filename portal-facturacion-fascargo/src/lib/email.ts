// src/lib/email.ts
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
  invoiceId: string,    
  invoiceTitle: string, 
  daysLeft: number, 
  expirationDate: Date
) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  // === LÓGICA DE TIEMPO EXACTO ===
  let timeRemainingString = `${daysLeft.toFixed(1)} días`;
  
  if (daysLeft < 0) {
    timeRemainingString = "Vencida";
  } else if (daysLeft < 1) {
    // Si queda menos de 1 día, calculamos horas y minutos
    const totalHours = daysLeft * 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours - hours) * 60);
    
    if (hours === 0) {
       timeRemainingString = `${minutes} minutos`;
    } else {
       timeRemainingString = `${hours} horas y ${minutes} minutos`;
    }
  }

  // === ESTILOS Y TEXTOS ===
  let subject = `Notificación: Documento "${invoiceTitle}" próximo a vencer`;
  let colorHeader = '#0d6efd'; // Azul FasCargo
  let urgencyTitle = 'Aviso de Vencimiento';
  let urgencyMessage = `Le informamos que el documento <strong>${invoiceTitle}</strong> está próximo a su fecha límite.`;

  // Si queda menos de 1 día (Alerta Roja)
  if (daysLeft <= 1) {
    subject = `🚨 ACCIÓN REQUERIDA: "${invoiceTitle}" vence en menos de 24h`;
    colorHeader = '#dc3545'; // Rojo Corporativo
    urgencyTitle = '⚠️ VENCIMIENTO INMINENTE';
    urgencyMessage = `ATENCIÓN: El documento <strong>${invoiceTitle}</strong> requiere su gestión inmediata para cumplir con los plazos establecidos.`;
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      
      <div style="background-color: ${colorHeader}; padding: 25px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">${urgencyTitle}</h1>
        <p style="color: #f0f0f0; margin: 5px 0 0 0; font-size: 14px;">Portal FasCargo</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Estimado usuario,</p>
        <p style="font-size: 16px; color: #555; line-height: 1.5;">${urgencyMessage}</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid ${colorHeader}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 12px; font-size: 15px;">
              <span style="color: #888; font-weight: 600;">📄 Documento:</span> <br>
              <span style="color: #333; font-size: 16px;">${invoiceTitle}</span>
            </li>
            <li style="margin-bottom: 12px; font-size: 15px;">
              <span style="color: #888; font-weight: 600;">📅 Fecha Límite:</span> <br>
              <span style="color: #333; font-size: 16px;">${formattedDate}</span>
            </li>
            <li style="margin-bottom: 0; font-size: 15px;">
              <span style="color: #888; font-weight: 600;">⏳ Tiempo Restante:</span> <br>
              <span style="color: ${daysLeft <= 1 ? '#dc3545' : '#333'}; font-weight: bold; font-size: 16px;">
                ${timeRemainingString}
              </span>
            </li>
          </ul>
        </div>

        <p style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/facturas/${invoiceId}" 
             style="background-color: ${colorHeader}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Gestionar Documento
          </a>
        </p>
        <p style="text-align: center; font-size: 13px; color: #999; margin-top: 20px;">
          Si el botón no funciona, copie y pegue la URL del portal en su navegador.
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; font-weight: 600;">© 2025 FasCargo Chile. Todos los derechos reservados.</p>
        <p style="margin: 8px 0 0 0;">Este es un mensaje generado automáticamente por el sistema de gestión documental.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Portal FasCargo" <${process.env.GMAIL_USER}>`,
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