// src/app/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import DeleteUserButton from '@/components/users/DeleteUserButton';
import { isAdminEmail } from '@/constants/admins';

type UserRow = {
  userId: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users'); // tu endpoint que retorna todos
      const data = await res.json();
      setUsers(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-4">
        <i className="bi bi-people-fill fs-3 text-primary" />
        <h2 className="m-0 fw-bold text-primary">Usuarios Registrados</h2>
      </div>

      {loading && <div className="alert alert-info">Cargando usuarios…</div>}

      <div className="row g-4">
        {users.map((u) => {
          const admin = isAdminEmail(u.email);

          return (
            <div key={u.userId} className="col-lg-4 col-md-6">
              <div className="card shadow-sm border-0 rounded-4 h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <a href={`mailto:${u.email}`} className="fw-bold fs-5 text-decoration-none">
                      {u.email}
                    </a>
                    {admin ? (
                      <span className="badge rounded-pill bg-primary-subtle text-primary fw-semibold">
                        Admin
                      </span>
                    ) : (
                      <span className="badge rounded-pill bg-secondary-subtle text-secondary">
                        Usuario
                      </span>
                    )}
                  </div>

                  <div className="text-muted small mb-3">
                    <div><strong>ID:</strong> {u.userId}</div>
                    {u.lastLoginAt && <div><strong>Último login:</strong> {new Date(u.lastLoginAt).toLocaleString()}</div>}
                    {u.createdAt && <div><strong>Creado:</strong> {new Date(u.createdAt).toLocaleString()}</div>}
                    {u.updatedAt && <div><strong>Actualizado:</strong> {new Date(u.updatedAt).toLocaleString()}</div>}
                  </div>

                  <div className="mt-auto d-flex justify-content-start">
                    <DeleteUserButton
                      userId={u.userId}
                      email={u.email}
                      onDeleted={fetchUsers}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && users.length === 0 && (
          <div className="col-12">
            <div className="alert alert-secondary">No hay usuarios registrados.</div>
          </div>
        )}
      </div>
    </div>
  );
}
