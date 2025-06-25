// ✅ src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

// GET: Buscar el usuario por userId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Falta el userId' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ userId });
    if (!user) return NextResponse.json({});

    return NextResponse.json({
      secret: user.secret2FA,
      email: user.email || null,
    });
  } catch (err) {
    console.error('[ERROR GET /api/users]', err);
    return NextResponse.json({ error: 'Error al buscar usuario' }, { status: 500 });
  }
}

// POST: Genera el secreto si no existe (sin email aún)
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Falta o es inválido el userId' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ userId });
    if (existing) {
      return NextResponse.json({ secret: existing.secret2FA });
    }

    const secret = speakeasy.generateSecret({ name: `FasCargo - ${userId}` });

    const newUser = await User.create({
      userId,
      secret2FA: secret.base32
    });

    return NextResponse.json({ secret: newUser.secret2FA });
  } catch (err: any) {
    console.error('[ERROR POST /api/users]', err.errors || err.message || err);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

// PUT: Actualiza email una vez verificado el token
export async function PUT(req: Request) {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    user.email = email;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ERROR PUT /api/users]', err);
    return NextResponse.json({ error: 'Error al guardar el correo' }, { status: 500 });
  }
}
