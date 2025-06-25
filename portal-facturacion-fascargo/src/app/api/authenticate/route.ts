import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({}, { status: 200 });

    await connectToDatabase();
    const user = await User.findOne({ userId });

    if (!user) return NextResponse.json({}, { status: 200 });

    return NextResponse.json({ secret: user.secret2FA }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error en GET authenticate' }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 200 });

    await connectToDatabase();
    const existing = await User.findOne({ userId });

    if (existing) return NextResponse.json({ secret: existing.secret2FA }, { status: 200 });

    const secret = speakeasy.generateSecret({ name: `FasCargo QR (${userId})` });

    const newUser = await User.create({
      userId,
      secret2FA: secret.base32
    });

    return NextResponse.json({ secret: newUser.secret2FA }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Error en POST authenticate' }, { status: 200 });
  }
}
