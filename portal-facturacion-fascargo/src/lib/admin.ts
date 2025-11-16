// src/lib/admin.ts
// ✅ Fuente única de admin list y helper
const ADMIN_EMAILS = [
  'topoblete@alumnos.uai.cl',
  'fascargo.chile.spa@gmail.com',
  'josriffo@alumnos.uai.cl', 
].map(e => e.trim().toLowerCase());

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export { ADMIN_EMAILS };
