// src/components/users/DeleteUserButton.tsx
'use client';

import { useState } from 'react';
import { isAdminEmail } from '@/constants/admins';

type Props = {
  userId: string;       // id técnico (p.ej. "fascargochilespa-corp")
  email: string;        // email visible
  onDeleted?: () => void; // callback para refrescar lista
};

export default function DeleteUserButton({ userId, email, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  // Ocultar completamente si es admin:
  if (isAdminEmail(email)) {
    return (
      <span className="badge rounded-pill bg-primary-subtle text-primary fw-semibold">
        Admin
      </span>
    );

    // Variante si prefieres mostrar botón deshabilitado:
    // return (
    //   <button className="btn btn-outline-secondary btn-sm" disabled title="No puedes eliminar administradores">
    //     <i className="bi bi-shield-lock me-1" />
    //     Admin
    //   </button>
    // );
  }

  const onDelete = async () => {
    if (!confirm(`¿Eliminar usuario ${email}? Esta acción es permanente.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      onDeleted?.();
    } catch (e: any) {
      alert(e?.message || 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
      onClick={onDelete}
      disabled={loading}
    >
      <i className="bi bi-trash" />
      {loading ? 'Eliminando…' : 'Eliminar Usuario'}
    </button>
  );
}
