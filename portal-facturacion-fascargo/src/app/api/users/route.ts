// ✅ src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// GET  ──────────────────────────────────────────────────────────────
// - Si viene ?userId=... → retorna un solo usuario (email + secret opcional)
// - Sin query → retorna listado de usuarios (para la vista de administración)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    await connectToDatabase();

    if (userId) {
      const user = await User.findOne({ userId });
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      return NextResponse.json({
        userId: user.userId,
        email: user.email,
        // ⚠️ No exponemos el secret completo en usos generales; lo dejamos para POST creación
        secret: user.secret2FA || null,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
        lastLoginAt: user.lastLoginAt || null,
      });
    }

    // Listado
    const users = await User.find().sort({ updatedAt: -1 });
    const result = users.map((u: any) => ({
      userId: u.userId,
      email: u.email,
      createdAt: u.createdAt || null,
      updatedAt: u.updatedAt || null,
      lastLoginAt: u.lastLoginAt || null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('❌ GET /api/users error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST ─────────────────────────────────────────────────────────────
// Crea secreto 2FA si aún no existe para ese usuario
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, email } = body || {};

    if (!userId || !email) {
      return NextResponse.json({ error: 'Faltan datos: userId y email son obligatorios' }, { status: 400 });
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
    // opcional: si no tuviera userId, se podría asignar uno:
    if (!user.userId) user.userId = uuidv4();
    await user.save();

    return NextResponse.json({
      secret: secret.base32,
      email: user.email, // ✅ evita "undefined" en el cliente
      userId: user.userId,
    });
  } catch (err) {
    console.error('❌ POST /api/users error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
