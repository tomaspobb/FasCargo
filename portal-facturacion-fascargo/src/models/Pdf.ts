import mongoose, { Schema, Model } from "mongoose";

export interface IPdf {
  _id?: string;

  // UI
  title: string;            // título visible de la factura (NO depende de la carpeta)
  url: string;              // URL pública (Vercel Blob)
  uploadedBy?: string;      // email o userId (opcional)

  // Carpeta lógica (para agrupación / KPIs)
  folderName?: string | null; // <— NUEVO: nombre de carpeta elegido o creado; si falta, se agrupa por estandarización del título

  // Estados
  estadoPago: "pagada" | "pendiente" | "anulada" | "vencida";
  estadoSistema: "uploaded" | "parsed" | "validated" | "rejected";

  // Metadatos
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

    folderName: { type: String, default: null }, // <— NUEVO

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

export const Pdf: Model<IPdf> =
  mongoose.models.Pdf || mongoose.model<IPdf>("Pdf", PdfSchema);
