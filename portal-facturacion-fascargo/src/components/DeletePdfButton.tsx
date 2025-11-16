// src/components/DeletePdfButton.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useMemo, useState } from 'react';
import { isAdminEmail } from '@/lib/admin';

export function DeletePdfButton({ id }: { id: string }) {
  const { email } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  // Admin robusto: usa utilidad centralizada + fallback a localStorage
  const userEmail = useMemo(() => {
    if (email) return email.trim().toLowerCase();
    try {
      const e = localStorage.getItem('email');
      return (e || '').trim().toLowerCase();
    } catch {
      return '';
    }
  }, [email]);

  const isAdmin = useMemo(() => isAdminEmail(userEmail), [userEmail]);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/pdf/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // El API valida con isAdminEmail(server) sobre este header:
          'x-user-email': userEmail,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('✅ Factura eliminada correctamente');
        // Volver a /facturas para refrescar listado
        setTimeout(() => router.push('/facturas'), 800);
      } else {
        toast.error(`❌ ${data.error || 'Error al eliminar la factura'}`);
      }
    } catch {
      toast.error('❌ Error de conexión con el servidor');
    } finally {
      setDeleting(false);
    }
  };

  // Solo renderiza si es admin
  if (!isAdmin) return null;

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="btn btn-danger rounded-pill px-4 fw-semibold mt-3"
      aria-disabled={deleting}
      aria-label="Eliminar factura"
      title="Eliminar factura"
    >
      {deleting ? 'Eliminando...' : '🗑️ Eliminar factura'}
    </button>
  );
}
