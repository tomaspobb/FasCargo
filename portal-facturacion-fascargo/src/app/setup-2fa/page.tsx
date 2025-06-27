'use client';

import { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { useRouter } from 'next/navigation';

export default function Setup2FA() {
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  // Al cargar la página, obtenemos el userId y el secreto 2FA
  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      router.push('/auth/login');
      return;
    }

    setUserId(storedId);
    fetchSecretAndEmail(storedId);
  }, []);

  // Obtiene el secreto y correo desde el backend, o lo genera si no existe
  const fetchSecretAndEmail = async (id: string) => {
    const res = await fetch(`/api/users?userId=${id}`);
    const data = await res.json();

    if (!data.secret) {
      const postRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
      const postData = await postRes.json();
      setSecret(postData.secret);
      setEmail(postData.email);
      setOtpAuthUrl(`otpauth://totp/FasCargo:${postData.email}?secret=${postData.secret}&issuer=FasCargo`);
    } else {
      setSecret(data.secret);
      setEmail(data.email || '');
      setOtpAuthUrl(`otpauth://totp/FasCargo:${data.email}?secret=${data.secret}&issuer=FasCargo`);
    }
  };

  // Verifica el código ingresado por el usuario
  const handleVerify = async () => {
    const res = await fetch('/api/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/dashboard'); // o la ruta final que desees
    } else {
      setError(data.error || 'Error al verificar el código');
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center py-5" style={{ maxWidth: '500px' }}>
      {/* Título principal y usuario generado */}
      <h2 className="mb-2 text-center text-primary">FasCargo</h2>
      {userId && (
        <p className="text-center text-muted mb-4">
          Usuario generado: <strong>{userId}</strong>
        </p>
      )}

      {/* Instrucciones */}
      <p className="text-center mb-3">
        Escanea el siguiente código QR con tu app de autenticación
        (como Google Authenticator o Authy) y luego ingresa el código.
      </p>

      {/* Código QR */}
      <div className="border p-3 rounded mb-4 bg-light">
        {otpAuthUrl && <QRCode value={otpAuthUrl} size={180} />}
      </div>

      {/* Input del código */}
      <label className="form-label w-100">Código de 6 dígitos:</label>
      <input
        type="text"
        className="form-control mb-3 text-center"
        maxLength={6}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="123456"
      />

      {/* Mensaje de error */}
      {error && <div className="alert alert-danger w-100">{error}</div>}

      {/* Botón de verificación */}
      <button
        onClick={handleVerify}
        className="btn btn-success w-100"
        disabled={token.length !== 6}
      >
        Verificar código
      </button>
    </div>
  );
}
