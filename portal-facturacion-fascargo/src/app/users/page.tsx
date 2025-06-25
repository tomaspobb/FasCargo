'use client';

import { useEffect, useState } from 'react';
import { Container, Table, Button } from 'react-bootstrap';

interface User {
  userId: string;
  createdAt: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = () => {
  fetch('/api/users')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Respuesta inválida:', data);
        setUsers([]); // Para evitar que explote
      }
    })
    .catch(err => {
      console.error('Error al obtener usuarios:', err);
      setUsers([]);
    });
};


  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' });
    fetchUsers();
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4 fw-bold text-primary text-center">Dispositivos registrados</h2>

      <Table striped bordered hover responsive className="mt-4">
        <thead>
          <tr>
            <th>ID del dispositivo</th>
            <th>Fecha de registro</th>
            <th>Último ingreso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td>{u.userId}</td>
              <td>{new Date(u.createdAt).toLocaleString()}</td>
              <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}</td>
              <td>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(u.userId)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
