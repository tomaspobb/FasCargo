// src/components/EditEstadoPago.tsx
'use client';

import { useState } from 'react';

export function EditEstadoPago({ id, initial }: { id: string; initial: 'pagada' | 'pendiente' | 'anulada' | 'vencida' }) {
  const [estado, setEstado] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const update = async (value: string) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pdf/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoPago: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar');
      setEstado(data.estadoPago);
      setMsg('Guardado ✔');
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <select
        className="form-select"
        style={{ maxWidth: 220 }}
        disabled={saving}
        value={estado}
        onChange={(e) => update(e.target.value)}
      >
        <option value="pendiente">Pendiente</option>
        <option value="pagada">Pagada</option>
        <option value="vencida">Vencida</option>
        <option value="anulada">Anulada</option>
      </select>
      {msg && <span className="text-muted small">{msg}</span>}
    </div>
  );
}
