'use client';

import { useRouter } from 'next/navigation';
import { Container } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();

  return (
    <main
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '85vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container
        className="text-center p-5 shadow-lg bg-white rounded-4"
        style={{ maxWidth: '700px' }}
      >
        <h1 className="display-4 fw-bold text-dark mb-3">
          Gestión de <span className="text-primary">Facturación</span>
        </h1>

        {isAuthenticated ? (
          <>
            <p className="lead text-muted mb-4">
              Hola, usuario <strong>#{userId}</strong>. Ya puedes acceder a tu panel de facturación.
            </p>
            <button
              className="btn btn-success btn-lg px-5 py-2 rounded-pill shadow-sm"
              onClick={() => router.push('/dashboard')}
            >
              Ir al Dashboard
            </button>
          </>
        ) : (
          <>
            <p className="lead text-muted mb-4">
              Plataforma interna para gestionar tus facturas de forma simple, ordenada y segura.
            </p>
            <button
              className="btn btn-primary btn-lg px-5 py-2 rounded-pill shadow-sm"
              onClick={() => router.push('/auth')}
            >
              Ingresar al sistema
            </button>
          </>
        )}
      </Container>
    </main>
  );
}
