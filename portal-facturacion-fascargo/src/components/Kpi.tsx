// src/components/Kpi.tsx
'use client';

export default function Kpi({
  label,
  value,
  subtle,
}: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={`p-3 rounded-3 ${subtle ? 'bg-light' : 'bg-white shadow-sm'} text-center`}>
      <div className="text-muted small">{label}</div>
      <div className="fw-bold fs-5 mt-1">{value}</div>
    </div>
  );
}
