import 'server-only';

// Tipos que ya usabas
export type ExtractedForIPdf = {
  folio?: string;
  proveedor?: string;
  fechaEmision?: Date;
  neto?: number;
  iva?: number;
  total?: number;
};

// Helper por si lo vuelves a necesitar en server en el futuro
export function normalizeSpaces(s: string) {
  return s.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

/**
 * Stub en servidor:
 * Ya no parseamos PDF en el server (lo hacemos en el cliente con pdfjs-dist).
 * Devolvemos un objeto vacío para mantener compatibilidad si hay imports residuales.
 */
export async function extractInvoiceForIPdf(
  _buffer: Buffer | Uint8Array
): Promise<ExtractedForIPdf> {
  return {};
}
