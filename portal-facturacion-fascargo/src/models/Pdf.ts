import mongoose, { Schema, model, models } from 'mongoose';

const PdfSchema = new Schema({
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Pdf = models.Pdf || model('Pdf', PdfSchema);
