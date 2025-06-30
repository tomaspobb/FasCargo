'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function DeletePdfButton({ id }: { id: string }) {
  const { data: session } = useSession();
  const router = useRouter();

  // Solo mostrar si el usuario es el admin autorizado
  if (session?.user?.email !== 'topoblete@alumnos.uai.cl') return null;

  const handleDelete = async () => {
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar esta factura?');
    if (!confirmDelete) return;

    const res = await fetch(`/api/pdf/${id}`, { method: 'DELETE' });

    if (res.ok) {
      router.push('/facturas');
    } else {
      const data = await res.json();
      alert(`Error al eliminar: ${data.error || 'Intenta nuevamente'}`);
    }
  };

  return (
    <button onClick={handleDelete} className="btn btn-danger">
      🗑️ Eliminar factura
    </button>
  );
}
