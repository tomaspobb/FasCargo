// ✅ src/app/api/verify-2fa/route.ts
import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  const { token } = await req.json();
  await connectToDatabase();

  const user = await User.findOne();
  if (!user) return NextResponse.json({ error: 'No hay ningún usuario registrado' }, { status: 404 });

  const verified = speakeasy.totp.verify({
    secret: user.secret2FA,
    encoding: 'base32',
    token
  });

  if (!verified) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 401 });
  }

  return NextResponse.json({ message: 'Autenticación exitosa' });
}