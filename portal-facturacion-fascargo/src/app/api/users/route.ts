// ✅ src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

// 🔹 GET → Obtener datos del usuario por userId
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findOne({ userId });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    email: user.email,
    secret: user.secret2FA || null
  });
}

// 🔹 POST → Crear 2FA si aún no existe
export async function POST(req: Request) {
  const { userId, email } = await req.json();

  if (!userId || !email) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findOne({ userId });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  if (user.secret2FA) {
    return NextResponse.json({ error: 'Ya tienes 2FA configurado' }, { status: 400 });
  }

  const speakeasy = await import('speakeasy');
  const secret = speakeasy.generateSecret({ length: 20 });

  user.secret2FA = secret.base32;
  await user.save();

  return NextResponse.json({
    secret: secret.base32,
    email: user.email // ✅ ¡Esto arregla el "undefined"!
  });
}
