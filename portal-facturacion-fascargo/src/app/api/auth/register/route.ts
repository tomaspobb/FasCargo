import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, userId } = await req.json();

    // Validar campos requeridos
    if (!email || !password || !userId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    await connectToDatabase();

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 });
    }

    // Encriptar la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      email,
      passwordHash,
      userId,
    });

    await newUser.save();

    return NextResponse.json({ message: 'Usuario registrado exitosamente' }, { status: 201 });
  } catch (err) {
    console.error('[ERROR REGISTER]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
