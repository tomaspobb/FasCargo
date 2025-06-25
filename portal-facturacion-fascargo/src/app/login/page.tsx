'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error || 'Error de autenticación');
      return;
    }

    // Guardamos userId para usar luego
    localStorage.setItem('userId', data.userId);

    // Redirigir según si tiene 2FA activado
    if (data.has2FA) {
      router.push('/dashboard');
    } else {
      router.push('/setup-2fa');
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: 400 }}>
      <h2 className="text-center fw-bold mb-4 text-primary">Iniciar sesión</h2>
      <form onSubmit={handleLogin} className="bg-white p-4 rounded shadow-sm">
        <div className="mb-3">
          <label className="form-label">Correo institucional</label>
          <input
            type="email"
            className="form-control text-center"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-control text-center"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 rounded-pill">
          Entrar
        </button>

        {error && <p className="text-danger text-center mt-3">{error}</p>}
      </form>
    </main>
  );
}
