'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userIdPreview, setUserIdPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const generateUserIdFromEmail = (email: string) => {
    const base = email.split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    const suffixes = ['-staff', '-corp', '-id', '-log', '-cargo'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return base + suffix;
  };

  useEffect(() => {
    if (email.trim()) {
      const generated = generateUserIdFromEmail(email);
      setUserIdPreview(generated);
    } else {
      setUserIdPreview('');
    }
  }, [email]);

  const handleRegister = async () => {
    setError('');
    const userId = userIdPreview;

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Error al registrar usuario');
    } else {
      localStorage.setItem('emailTemp', email);
      localStorage.setItem('passwordTemp', password);
      setSuccess(true);
      router.push('/auth/login');
    }
  };

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center py-5" style={{ maxWidth: '480px' }}>
      <div className="card shadow p-4 w-100">
        <h2 className="text-center text-secondary mb-4">Registro de Usuario</h2>

        {userIdPreview && (
          <div className="text-muted small mb-1">
            Usuario generado: <strong>{userIdPreview}</strong>
          </div>
        )}

        <label className="form-label">Correo institucional</label>
        <input
          type="email"
          className="form-control mb-3"
          placeholder="tucorreo@fascargo.cl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="form-label">Contraseña</label>
        <input
          type="password"
          className="form-control mb-3"
          placeholder="******"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <button
          className="btn btn-secondary w-100"
          onClick={handleRegister}
          disabled={!email || !password}
        >
          Registrarse
        </button>
      </div>
    </main>
  );
}
