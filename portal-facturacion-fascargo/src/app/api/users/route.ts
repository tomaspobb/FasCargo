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

    return NextResponse.json(user); // ← devuelve también el email para identificar admin
  } catch (err) {
    console.error('[ERROR GET /api/users]', err);
    return NextResponse.json({ error: 'Error al buscar usuario' }, { status: 500 });
  }
}

// POST: Crear nuevo usuario con userId (y opcionalmente email) y generar secreto
export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Falta el userId' }, { status: 400 });
    }

    await connectToDatabase();

    // Si ya existe, devolver su secreto
    const existing = await User.findOne({ userId });
    if (existing) {
      return NextResponse.json({ secret: existing.secret2FA });
    }

    // Generar nuevo secreto
    const secret = speakeasy.generateSecret({ name: `FasCargo Chile - Usuario ${userId}` });

    const newUser = await User.create({
      userId,
      secret2FA: secret.base32,
      email: email || undefined, // se guarda solo si viene incluido
    });

    return NextResponse.json({ secret: newUser.secret2FA });
  } catch (err) {
    console.error('[ERROR POST /api/users]', err);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
