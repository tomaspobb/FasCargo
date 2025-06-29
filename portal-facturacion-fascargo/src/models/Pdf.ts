import mongoose, { Schema, model, models } from 'mongoose';

// Definición del esquema del modelo PDF
const PdfSchema = new Schema({
  title: { type: String, required: true },     // Nombre personalizado del PDF
  url: { type: String, required: true },       // URL pública del archivo en Vercel Blob
  createdAt: { type: Date, default: Date.now } // Fecha de creación automática
});

// 🔄 En desarrollo, forzamos la recompilación del modelo para que tome cambios en el esquema
if (process.env.NODE_ENV !== 'production') {
  delete models.Pdf;
}

// Exportamos el modelo para que pueda ser usado en cualquier parte de la app
export const Pdf = models.Pdf || model('Pdf', PdfSchema);
