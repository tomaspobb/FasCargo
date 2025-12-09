'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EditFechaVencimiento({ id, initial }: { id: string; initial?: string | Date | null }) {
  const router = useRouter();
  
  // Función para formatear fecha a "YYYY-MM-DDTHH:MM" (formato que pide el input)
  const formatForInput = (date: string | Date | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    // Ajuste manual a zona horaria local para que el input muestre la hora correcta
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [date, setDate] = useState(formatForInput(initial));
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value; // Viene como "2023-10-25T14:30"
    setDate(newVal);
    setLoading(true);

    try {
      await fetch(`/api/facturas/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaVencimiento: newVal || null }),
      });
      router.refresh(); 
    } catch (error) {
      console.error('Error actualizando:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <input
        type="datetime-local"  // <--- CAMBIO CLAVE AQUÍ
        className="form-control form-control-sm"
        value={date}
        onChange={handleChange}
        disabled={loading}
        style={{ maxWidth: '210px', fontSize: '0.85rem' }} // Un poco más ancho para que quepa la hora
      />
      {loading && <span className="spinner-border spinner-border-sm text-primary" />}
    </div>
  );
}