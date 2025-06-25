import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  return NextResponse.json({
    userId: user._id.toString(),
    has2FA: !!user.secret2FA,
  });
}
