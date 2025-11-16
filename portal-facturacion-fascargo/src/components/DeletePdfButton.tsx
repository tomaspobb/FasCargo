// src/components/DeletePdfButton.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useState, useMemo } from 'react';
import { isAdminEmail } from '@/lib/admin';

export function DeletePdfButton({ id }: { id: string }) {
  const { email } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const canDelete = useMemo(() => isAdminEmail(email || ''), [email]);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta factura?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pdf/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': email || '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      toast.success('✅ Factura eliminada');
      router.push('/facturas');
    } catch (e: any) {
      toast.error(`❌ ${e.message || 'Error de red'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!canDelete) return null;

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="btn btn-danger rounded-pill px-4 fw-semibold mt-3"
    >
      {deleting ? 'Eliminando…' : '🗑️ Eliminar factura'}
    </button>
  );
}
