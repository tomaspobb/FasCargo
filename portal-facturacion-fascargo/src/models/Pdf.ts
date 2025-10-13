import mongoose, { Schema, Model } from "mongoose";

export interface IPdf {
  _id?: string;
  title: string;           // nombre visible en UI
  url: string;             // URL pública de Vercel Blob
  uploadedBy?: string;     // email o userId (opcional por ahora)

  // Estados de negocio y de proceso
  estadoPago: "pagada" | "pendiente" | "anulada" | "vencida";
  estadoSistema: "uploaded" | "parsed" | "validated" | "rejected";

  // Metadatos contables mínimos (opcionales)
  folio?: string;
  proveedor?: string;
  fechaEmision?: Date;
  fechaPago?: Date | null;
  neto?: number;
  iva?: number;
  total?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

const PdfSchema = new Schema<IPdf>(
  {
    title: { type: String, required: true },
    url:   { type: String, required: true },
    uploadedBy: { type: String },

    estadoPago: {
      type: String,
      enum: ["pagada","pendiente","anulada","vencida"],
      default: "pendiente"
    },
    estadoSistema: {
      type: String,
      enum: ["uploaded","parsed","validated","rejected"],
      default: "uploaded"
    },

    folio: String,
    proveedor: String,
    fechaEmision: Date,
    fechaPago: { type: Date, default: null },
    neto: Number,
    iva: Number,
    total: Number,
  },
  { timestamps: true }
);

export const Pdf: Model<IPdf> = mongoose.models.Pdf || mongoose.model<IPdf>("Pdf", PdfSchema);
