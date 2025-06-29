'use client';

import { useRouter } from 'next/navigation';

export function DeletePdfButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleDelete}>
      <button type="submit" className="btn btn-danger">
        🗑️ Eliminar factura
      </button>
    </form>
  );
}
