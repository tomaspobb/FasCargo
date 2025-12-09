import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendExpirationAlert = async (to: string, invoiceId: string, daysLeft: number, expirationDate: Date) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString('es-CL');
  
  let subject = `⚠️ Recordatorio: Factura por vencer en ${daysLeft} días`;
  let urgencyText = `La factura con ID ${invoiceId} vence pronto.`;

  if (daysLeft <= 1) {
    subject = `🚨 URGENTE: Factura vence en menos de 24 horas`;
    urgencyText = `ATENCIÓN: La factura ${invoiceId} está a punto de expirar.`;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: ${daysLeft <= 1 ? '#d9534f' : '#f0ad4e'};">${subject}</h2>
      <p>Hola Administrador de Fast Cargo,</p>
      <p>${urgencyText}</p>
      <ul>
        <li><strong>ID Documento:</strong> ${invoiceId}</li>
        <li><strong>Fecha Vencimiento:</strong> ${formattedDate}</li>
        <li><strong>Días restantes:</strong> ${daysLeft.toFixed(1)} días</li>
      </ul>
      <p>Por favor, revisa el portal para más detalles.</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/facturas/${invoiceId}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Ir a la Factura</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Fast Cargo Notificaciones" <${process.env.GMAIL_USER}>`,
      to: to, // Aquí llegará el correo
      subject: subject,
      html: htmlContent,
    });
    console.log(`Correo enviado para factura ${invoiceId}`);
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return false;
  }
};