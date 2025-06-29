// src/models/Pdf.ts

import mongoose from 'mongoose';

const PdfSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Pdf = mongoose.models.Pdf || mongoose.model('Pdf', PdfSchema);
