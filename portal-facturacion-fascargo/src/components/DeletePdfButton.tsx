'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export function DeletePdfButton({ id }: { id: string }) {
  const { email } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar esta factura?');
    if (!confirmDelete) return;

    const res = await fetch(`/api/pdf/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email || '',
      },
    });

    if (res.ok) {
      router.push('/facturas');
    } else {
      const data = await res.json();
      alert(`Error al eliminar: ${data.error || 'Intenta nuevamente'}`);
    }
  };

  // Solo mostrar botón si es el admin
  if (email !== 'topoblete@alumnos.uai.cl') return null;

  return (
    <button onClick={handleDelete} className="btn btn-danger">
      🗑️ Eliminar factura
    </button>
  );
}
