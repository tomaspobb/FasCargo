'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeletePdfButton({ id }: { id: string }) {
  const { email } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ADMIN_EMAILS = [
    'topoblete@alumnos.uai.cl',
    'fascargo.chile.spa@gmail.com',
  ];

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;

    setDeleting(true);
    setError(null);
    setMessage(null);

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
        setMessage('✅ Factura eliminada correctamente');
        setTimeout(() => router.push('/facturas'), 1500);
      } else {
        setError(`❌ ${data.error || 'Error al eliminar la factura'}`);
      }
    } catch (err) {
      setError('❌ Error al conectar con el servidor');
    } finally {
      setDeleting(false);
    }
  };

  // Solo mostrar el botón si es admin
  if (!email || !ADMIN_EMAILS.includes(email)) return null;

  return (
    <div className="mt-4">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="btn btn-danger rounded-pill px-4 fw-semibold"
      >
        {deleting ? 'Eliminando...' : '🗑️ Eliminar factura'}
      </button>

      {/* ✅ Toasts de feedback */}
      {message && (
        <div
          className="alert alert-success mt-3 rounded-3 shadow-sm py-2 px-3 text-center"
          role="alert"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger mt-3 rounded-3 shadow-sm py-2 px-3 text-center"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
