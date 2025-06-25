// ✅ src/app/api/verify-2fa/route.ts (mejorado con códigos HTTP correctos)
import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId, token } = await req.json();

    if (!userId || !token) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 }); // ❌ Datos incompletos
    }

    await connectToDatabase();
    const user = await User.findOne({ userId });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 }); // ❌ No existe
    }

    const verified = speakeasy.totp.verify({
      secret: user.secret2FA,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 401 }); // ❌ No autorizado
    }

    user.lastLogin = new Date();
    await user.save();

    return NextResponse.json({ message: 'Autenticación exitosa' }); // ✅ OK por defecto es 200
  } catch (err) {
    console.error('[ERROR 2FA]', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 }); // ❌ Error inesperado
  }
}
