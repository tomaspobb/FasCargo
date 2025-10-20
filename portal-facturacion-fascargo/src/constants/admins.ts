// src/constants/admins.ts
export const ADMIN_EMAILS = [
  'topoblete@alumnos.uai.cl',
  'fascargo.chile.spa@gmail.com',
] as const;

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase() as (typeof ADMIN_EMAILS)[number]);
