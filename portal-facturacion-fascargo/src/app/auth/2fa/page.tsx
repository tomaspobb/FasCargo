'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { useRouter } from 'next/navigation';

export default function Setup2FA() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [error, setError] = useState('');

  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('email');
    const twoFAFlag = localStorage.getItem('2faInProgress');

    if (!storedId || !storedEmail || !twoFAFlag) {
      router.push('/auth/login');
      return;
    }

    setUserId(storedId);
    setEmail(storedEmail);
    fetchSecretAndEmail(storedId, storedEmail);
  }, []);

  const fetchSecretAndEmail = async (id: string, mail: string) => {
    try {
      const res = await fetch(`/api/users?userId=${id}`);
      const data = await res.json();

      const secretToUse = data.secret || (await generateNewSecret(id, mail));
      setSecret(secretToUse);
      setOtpAuthUrl(`otpauth://totp/FasCargo:${mail}?secret=${secretToUse}&issuer=FasCargo`);
    } catch (err) {
      setError('No se pudo generar el código 2FA.');
    }
  };

  const generateNewSecret = async (id: string, mail: string): Promise<string> => {
    const postRes = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, email: mail }),
    });
    const postData = await postRes.json();
    return postData.secret;
  };

  const handleVerify = async () => {
    const token = digits.join('');
    if (token.length !== 6) return;

    const res = await fetch('/api/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Marcar sesión como verificada y limpiar flags anteriores
      localStorage.setItem('sessionVerified', 'true');
      localStorage.removeItem('2faInProgress');

      // 🔁 Redirige y recarga toda la app (incluida la Navbar)
      window.location.href = '/dashboard';
    } else {
      setError(data.error || 'Error al verificar el código');
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center py-5" style={{ minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h4 className="text-center text-primary mb-3">Verificación en dos pasos</h4>
        <p className="text-center mb-4">
          Escanea este código QR con una app de autenticación como <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, <strong>Authy</strong> u otra compatible con códigos TOTP. Luego, ingresa el código de 6 dígitos que se genera en tu app.
        </p>

        {otpAuthUrl && (
          <div className="d-flex justify-content-center mb-3">
            <QRCode value={otpAuthUrl} size={180} />
          </div>
        )}

        <p className="text-center text-muted mb-3">
          Usuario actual: <span className="text-danger fw-bold">{email}</span>
        </p>

        {/* Inputs separados */}
        <div className="d-flex justify-content-between mb-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={digit}
              ref={(el) => (inputsRef.current[i] = el!)}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="form-control text-center me-1"
              style={{ width: '40px', fontSize: '1.5rem' }}
            />
          ))}
        </div>

        {error && <div className="alert alert-danger text-center">{error}</div>}

        <button className="btn btn-primary w-100" onClick={handleVerify} disabled={digits.join('').length !== 6}>
          Verificar código
        </button>
      </div>
    </div>
  );
}
