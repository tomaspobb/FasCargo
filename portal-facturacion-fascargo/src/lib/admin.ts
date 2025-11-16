// src/lib/admin.ts
export const ADMIN_EMAILS = [
  'topoblete@alumnos.uai.cl',
  'fascargo.chile.spa@gmail.com',
  'josriffo@alumnos.uai.cl.com'
];

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
