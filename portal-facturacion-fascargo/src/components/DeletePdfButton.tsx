'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useState } from 'react';

export function DeletePdfButton({ id }: { id: string }) {
  const { email } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const ADMIN_EMAILS = [
    'topoblete@alumnos.uai.cl',
    'fascargo.chile.spa@gmail.com',
  ];

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/pdf/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email || '',
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('✅ Factura eliminada correctamente');
        setTimeout(() => router.push('/facturas'), 2000);
      } else {
        toast.error(`❌ ${data.error || 'Error al eliminar la factura'}`);
      }
    } catch {
      toast.error('❌ Error de conexión con el servidor');
    } finally {
      setDeleting(false);
    }
  };

  // Mostrar solo si el usuario es admin
  if (!email || !ADMIN_EMAILS.includes(email)) return null;

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="btn btn-danger rounded-pill px-4 fw-semibold mt-3"
    >
      {deleting ? 'Eliminando...' : '🗑️ Eliminar factura'}
    </button>
  );
}
