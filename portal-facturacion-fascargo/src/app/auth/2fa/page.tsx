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

  // ✅ Al cargar la página, verificar si viene del login (2FA en progreso)
  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('email');
    const twoFAFlag = localStorage.getItem('2faInProgress');

    // Redirige si falta contexto (por seguridad)
    if (!storedId || !storedEmail || !twoFAFlag) {
      router.push('/auth/login');
      return;
    }

    setUserId(storedId);
    setEmail(storedEmail);
    fetchSecretAndEmail(storedId, storedEmail);
  }, []);

  // ✅ Obtener o generar el secreto 2FA
  const fetchSecretAndEmail = async (id: string, mail: string) => {
    try {
      const res = await fetch(`/api/users?userId=${id}`);
      const data = await res.json();

      const secretToUse = data.secret || (await generateNewSecret(id, mail));
      setSecret(secretToUse);
      setOtpAuthUrl(`otpauth://totp/FasCargo:${mail}?secret=${secretToUse}&issuer=FasCargo`);
    } catch (err) {
      console.error('Error al generar el secreto:', err);
      setError('No se pudo generar el código 2FA.');
    }
  };

  // ✅ Si no existe secreto, lo genera con POST
  const generateNewSecret = async (id: string, mail: string): Promise<string> => {
    const postRes = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, email: mail }),
    });

    const postData = await postRes.json();
    return postData.secret;
  };

  // ✅ Verificar código ingresado
  const handleVerify = async () => {
    const res = await fetch('/api/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem('2faInProgress'); // ✅ Se borra la bandera
      router.push('/dashboard');
    } else {
      setError(data.error || 'Error al verificar el código');
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center py-5" style={{ maxWidth: '500px' }}>
      {/* 🔷 Título y usuario */}
      <h2 className="mb-2 text-center text-primary">FasCargo</h2>
      {userId && (
        <p className="text-center text-muted mb-4">
          Usuario generado: <strong>{userId}</strong>
        </p>
      )}

      {/* 🧾 Instrucciones */}
      <p className="text-center mb-3">
        Escanea el siguiente código QR con tu app de autenticación
        (como Google Authenticator o Authy) y luego ingresa el código.
      </p>

      {/* 🔳 Código QR */}
      <div className="border p-3 rounded mb-4 bg-light">
        {otpAuthUrl && <QRCode value={otpAuthUrl} size={180} />}
      </div>

      {/* 🔢 Código de verificación */}
      <label className="form-label w-100">Código de 6 dígitos:</label>
      <input
        type="text"
        className="form-control mb-3 text-center"
        maxLength={6}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="123456"
      />

      {/* ❌ Mensaje de error */}
      {error && <div className="alert alert-danger w-100">{error}</div>}

      {/* ✅ Botón de verificación */}
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
