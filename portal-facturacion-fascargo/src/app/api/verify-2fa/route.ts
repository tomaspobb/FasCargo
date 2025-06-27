// ✅ src/app/api/verify-2fa/route.ts
import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId, token } = await req.json();

    if (!userId || !token) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ userId });

    if (!user || !user.secret2FA) {
      return NextResponse.json({ error: 'Usuario no encontrado o sin 2FA' }, { status: 404 });
    }

    const verified = speakeasy.totp.verify({
      secret: user.secret2FA,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 401 });
    }

    // Puedes guardar la hora del último login si quieres
    user.lastLogin = new Date();
    await user.save();

    return NextResponse.json({ message: 'Autenticación exitosa' });
  } catch (err) {
    console.error('[ERROR VERIFY 2FA]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
