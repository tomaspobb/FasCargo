// src/lib/admin.ts
// Única fuente de verdad. Funciona en cliente y servidor.

const parseCsv = (s?: string | null) =>
  (s || '')
    .split(',')
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);

// Fallbacks hardcodeados (opcional) por si no hay env vars:
const FALLBACK = [
  'topoblete@alumnos.uai.cl',
  'fascargo.chile.spa@gmail.com',
  'josriffo@alumnos.uai.cl'
  // puede dejar vacío este array si quiere 100% por env
];

// CLIENTE: usa NEXT_PUBLIC_*
const PUBLIC_ADMINS = parseCsv(process.env.NEXT_PUBLIC_ADMIN_EMAILS);

// SERVIDOR: usa ADMIN_EMAILS
const SERVER_ADMINS = parseCsv(process.env.ADMIN_EMAILS);

// Lista unificada en cliente:
export const clientAdminList =
  (typeof window !== 'undefined' ? PUBLIC_ADMINS : []) .concat(FALLBACK);

// Lista unificada en server:
export const serverAdminList =
  (typeof window === 'undefined' ? SERVER_ADMINS : []) .concat(FALLBACK);

// Helper único (safe en cliente y server)
export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  // En cliente usamos clientAdminList; en server, serverAdminList
  const list = typeof window !== 'undefined' ? clientAdminList : serverAdminList;
  return list.includes(e);
}
