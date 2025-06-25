'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

export default function LoginQRPage() {
  const [userId, setUserId] = useState('');
  const [secret, setSecret] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'loading' | 'register' | 'verify'>('loading');
  const [error, setError] = useState('');

  const restart = () => {
    localStorage.removeItem('userId');
    window.location.reload();
  };

  useEffect(() => {
    const localId = localStorage.getItem('userId') || uuidv4();
    localStorage.setItem('userId', localId);
    setUserId(localId);

    fetch(`/api/users?userId=${localId}`)
      .then(res => res.json())
      .then(data => {
        if (data.secret) {
          setSecret(data.secret);
          setStep('verify');
        } else {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: localId }),
          })
            .then(res => res.json())
            .then(data => {
              setSecret(data.secret);
              setStep('register');
            });
        }
      })
      .catch(() => setError('Error al generar el acceso.'));
  }, []);

  const handleContinue = () => {
    if (!email.includes('@')) {
      setError('Correo no válido');
      return;
    }
    setError('');
    setStep('verify');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      setError(data.error || 'Código inválido');
      return;
    }

    // Solo guardar si el código es válido
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });

    window.location.href = '/dashboard';
  };

  return (
    <main className="container d-flex justify-content-center align-items-center py-5" style={{ minHeight: '80vh' }}>
      <div className="bg-white p-5 rounded shadow text-center" style={{ maxWidth: 460, width: '100%' }}>
        <h2 className="mb-4 fw-bold text-primary">
          {step === 'register' ? 'Registra tu dispositivo' : 'Verifica tu identidad'}
        </h2>

              {step === 'register' && secret && (
        <>
          <p>Escanea este código con Microsoft Authenticator</p>
          <QRCodeCanvas
            value={`otpauth://totp/FasCargo%20Chile?secret=${secret}&issuer=FasCargo`}
            size={180}
          />
          <p className="text-muted small mt-2">Tu acceso estará vinculado a este dispositivo.</p>

            <input
              type="email"
              placeholder="Correo institucional"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-control text-center mt-4"
            />
            <button className="btn btn-primary w-100 mt-3 rounded-pill" onClick={handleContinue}>
              Guardar y continuar
            </button>
          </>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify}>
            <label className="form-label">Código 2FA</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="form-control text-center mb-3"
              required
            />
            <button className="btn btn-success w-100 rounded-pill" type="submit">
              Ingresar
            </button>
            <button className="btn btn-link mt-2 text-danger" type="button" onClick={restart}>
              ¿Perdiste tu acceso? Generar nuevo código
            </button>
          </form>
        )}

        {error && <p className="text-danger mt-3 fw-semibold">{error}</p>}
      </div>
    </main>
  );
}
