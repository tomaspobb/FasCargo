'use client'

import { useEffect, useState } from 'react'
import { Trash } from 'lucide-react'

interface UserInfo {
  email: string
  userId: string
  lastLogin: string
  updatedAt: string
  createdAt: string
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const adminEmail = 'topoblete@alumnos.uai.cl'

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/devices?email=${adminEmail}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(data.users)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (userId: string) => {
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este usuario?')
    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/admin/users?email=${adminEmail}&userId=${userId}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario')

      setUsers(prev => prev.filter(u => u.userId !== userId))
      setSuccess('Usuario eliminado correctamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold text-primary">👥 Usuarios Registrados</h1>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Cargando datos...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="alert alert-danger text-center">{error}</div>
          )}
          {success && (
            <div className="alert alert-success text-center">{success}</div>
          )}

          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {users.map((user) => (
              <div key={user.userId} className="col">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-2 text-primary fw-semibold">{user.email}</h5>
                    <p className="mb-1"><strong>ID:</strong> <span className="text-muted">{user.userId}</span></p>
                    <p className="mb-1"><strong>Último login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
                    <p className="mb-1"><strong>Creado:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                    <p className="mb-3"><strong>Actualizado:</strong> {new Date(user.updatedAt).toLocaleString()}</p>

                    {user.email !== adminEmail && (
                      <button
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-2"
                        onClick={() => handleDelete(user.userId)}
                      >
                        <Trash size={16} />
                        Eliminar Usuario
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
