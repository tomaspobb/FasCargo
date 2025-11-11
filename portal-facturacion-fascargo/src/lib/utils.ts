export const CLP = (n?: number | null) =>
  typeof n === 'number' ? 'CLP ' + n.toLocaleString('es-CL') : '—';

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

// Estándar por título (legacy)
export function groupKeyByTitle(title: string) {
  return (title || 'Sin nombre')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

// DTO común
export type InvoiceDTO = {
  id: string;
  title: string;
  createdAt: string;
  estadoPago: 'pagada' | 'pendiente' | 'anulada' | 'vencida';
  total: number | null;
  proveedor?: string | null;
  folio?: string | null;
  folderName?: string | null; // <— NUEVO en front
};

// Nueva: devuelve el nombre de carpeta real a usar
export function resolveFolderName(inv: { title: string; folderName?: string | null }) {
  return (inv.folderName && inv.folderName.trim()) || groupKeyByTitle(inv.title);
}

// Compatibilidad: groupKey = resolveFolderName sobre el objeto
export function groupKey(inv: { title: string; folderName?: string | null }) {
  return resolveFolderName(inv);
}
