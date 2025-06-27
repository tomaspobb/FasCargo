// ✅ src/app/api/seed-user/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'supersecreto123'; // configúralo en tu .env

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, secret } = body;

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Usuario ya existe' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      passwordHash,
      userId: uuidv4(),
      secret2FA: '',
      lastLogin: null
    });

    await newUser.save();

    return NextResponse.json({ message: 'Usuario creado con éxito', email: newUser.email });
  } catch (error) {
    console.error('[SEED USER ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
