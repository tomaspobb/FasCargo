'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Si vienes desde el registro, precarga el email y password
  useEffect(() => {
    const emailTemp = localStorage.getItem('emailTemp');
    const passwordTemp = localStorage.getItem('passwordTemp');

    if (emailTemp && passwordTemp) {
      setEmail(emailTemp);
      setPassword(passwordTemp);
      localStorage.removeItem('emailTemp');
      localStorage.removeItem('passwordTemp');
    }
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
      localStorage.setItem('userId', data.userId);
      router.push('/setup-2fa');
    }
  };

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center py-5" style={{ maxWidth: '480px' }}>
      <div className="card shadow p-4 w-100">
        <h2 className="text-center text-primary mb-4">Ingreso de Usuario</h2>

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
          className="btn btn-primary w-100"
          onClick={handleLogin}
          disabled={!email || !password}
        >
          Ingresar
        </button>
      </div>
    </main>
  );
}
