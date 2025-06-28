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

  // Genera un userId profesional basado en el correo
  const generateUserIdFromEmail = (email: string) => {
    const base = email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    const suffixes = ['-staff', '-corp', '-id', '-log', '-cargo'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return base + suffix;
  };

  // Actualiza el preview del userId cada vez que cambia el correo
  useEffect(() => {
    if (email.trim()) {
      const generated = generateUserIdFromEmail(email);
      setUserIdPreview(generated);
    } else {
      setUserIdPreview('');
    }
  }, [email]);

  // Maneja el registro
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
      // Guardamos datos en localStorage para autocompletar el login
      localStorage.setItem('userId', userId);
      localStorage.setItem('email', email);
      localStorage.setItem('passwordTemp', password);
      localStorage.setItem('fromRegister', 'true');

      setSuccess(true);

      // Espera corta para asegurar que se guarden antes del redireccionamiento
      setTimeout(() => {
        router.push('/auth/login');
      }, 150);
    }
  };

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center py-5" style={{ maxWidth: '480px' }}>
      <div className="card shadow p-4 w-100">
        <h2 className="text-center text-secondary mb-4">Registro de Usuario</h2>

        {userIdPreview && (
          <div className="text-muted small mb-3">
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
          autoComplete="email"
        />

        <label className="form-label">Contraseña</label>
        <input
          type="password"
          className="form-control mb-3"
          placeholder="******"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
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
