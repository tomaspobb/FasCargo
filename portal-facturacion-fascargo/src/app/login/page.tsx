'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

export default function LoginQRPage() {
  const [userId, setUserId] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'loading' | 'register' | 'verify'>('loading');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reiniciarQR = () => {
    localStorage.removeItem('userId');
    window.location.reload();
  };

  useEffect(() => {
    const localId = localStorage.getItem('userId');
    const newId = localId || uuidv4();
    setUserId(newId);

    fetch(`/api/users?userId=${newId}`)
      .then(async res => {
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then(data => {
        if (data.secret) {
          setSecret(data.secret);
          setStep('verify');
        } else {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: newId }),
          })
            .then(async res => {
              const text = await res.text();
              return text ? JSON.parse(text) : {};
            })
            .then(data => {
              setSecret(data.secret);
              setStep('register');
              localStorage.setItem('userId', newId);
            });
        }
      })
      .catch(err => {
        console.error('Error generando QR:', err);
        setError('No se pudo generar el acceso.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Código inválido');
      return;
    }

    alert('✅ Acceso concedido');
  };

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '80vh' }}>
      <div className="bg-white border rounded-4 shadow p-5 text-center" style={{ maxWidth: '440px', width: '100%' }}>
        {loading ? (
          <h4 className="text-muted">Cargando...</h4>
        ) : (
          <>
            <h2 className="mb-4 fw-bold text-primary">
              {step === 'register' ? 'Registra tu dispositivo' : 'Verifica tu identidad'}
            </h2>

            {step === 'register' && (
              <>
                <p>Escanea este código con Microsoft Authenticator</p>
                <QRCodeCanvas
                value={`otpauth://totp/FasCargo%20Chile?secret=${secret}&issuer=FasCargo`}
                size={180}
              />
                <p className="text-muted small mt-2">Tu acceso estará vinculado a este dispositivo.</p>
              </>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerify}>
                <div className="mb-3">
                  <label className="form-label">Código 2FA</label>
                  <input
                    type="text"
                    className="form-control text-center"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success w-100 rounded-pill">Ingresar</button>
                {error && <p className="text-danger mt-3 text-center">{error}</p>}
                <button type="button" className="btn btn-link mt-3 text-danger" onClick={reiniciarQR}>
                  ¿Perdiste tu acceso? Generar nuevo código QR
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
