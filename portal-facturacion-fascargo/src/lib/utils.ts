// src/lib/ui.ts
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);

export const CLP = (n?: number | null) =>
  typeof n === 'number' ? n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }) : '—';

export type InvoiceDTO = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt?: string;
  proveedor?: string | null;
  folio?: string | null;
  neto?: number | null;
  iva?: number | null;
  total?: number | null;
  estadoPago?: 'pagada' | 'pendiente' | 'anulada' | 'vencida';
  estadoSistema?: 'uploaded' | 'parsed' | 'validated' | 'rejected';
};

// agrupa por “carpeta”: preferimos title; si no, proveedor
export const groupKey = (i: InvoiceDTO) => (i.title?.trim() || i.proveedor?.trim() || 'Sin nombre');
