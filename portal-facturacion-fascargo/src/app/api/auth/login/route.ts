// ✅ src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Usuario no registrado' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // ✅ Registrar fecha y hora del último login
    user.lastLogin = new Date();
    await user.save();

    return NextResponse.json({ userId: user.userId }, { status: 200 });
  } catch (err) {
    console.error('[ERROR LOGIN]', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
