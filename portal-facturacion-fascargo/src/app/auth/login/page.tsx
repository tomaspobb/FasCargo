'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Solo si viene del registro, se autocompleta
    const fromRegister = localStorage.getItem('fromRegister');
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('passwordTemp');

    if (fromRegister && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
    }

    // Limpiar datos temporales de registro
    localStorage.removeItem('email');
    localStorage.removeItem('passwordTemp');
    localStorage.removeItem('fromRegister');
  }, []);

  const handleLogin = async () => {
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Error al iniciar sesión');
    } else {
      // ✅ Guardar userId y email en localStorage
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', email);
      localStorage.setItem('2faInProgress', 'true'); // Bandera de sesión 2FA

      // ✅ Dar un pequeño delay antes del redirect para asegurar que se guarde
      setTimeout(() => {
        router.push('/auth/2fa');
      }, 100);
    }
  };

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center py-5" style={{ maxWidth: '480px' }}>
      <div className="card shadow p-4 w-100">
        <h2 className="text-center text-secondary mb-4">Iniciar Sesión</h2>

        <label className="form-label">Correo electrónico</label>
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
          autoComplete="current-password"
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <button
          className="btn btn-primary w-100"
          onClick={handleLogin}
          disabled={!email || !password}
        >
          Iniciar sesión
        </button>
      </div>
    </main>
  );
}
