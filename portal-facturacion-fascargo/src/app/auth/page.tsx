'use client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  return (
    <main className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="container">
        <div className="row justify-content-center gap-4">
          <div
            className="col-md-5 card text-center shadow-lg p-5 border-0"
            onClick={() => router.push('/auth/login')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <h3 className="text-primary mb-3">Ingreso de Usuario</h3>
            <p className="text-muted">Accede con tu cuenta corporativa</p>
          </div>

          <div
            className="col-md-5 card text-center shadow-lg p-5 border-0"
            onClick={() => router.push('/auth/register')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <h3 className="text-secondary mb-3">Registro de Usuario</h3>
            <p className="text-muted">Crea tu cuenta institucional</p>
          </div>
        </div>
      </div>
    </main>
  );
}
