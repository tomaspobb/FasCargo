import mongoose, { Schema } from 'mongoose';

const PdfSchema = new Schema({
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Pdf = mongoose.models.Pdf || mongoose.model('Pdf', PdfSchema);
