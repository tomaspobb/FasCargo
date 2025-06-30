import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { User } from '@/models/User'

// 🔐 Ruta exclusiva para admin
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (email !== 'topoblete@alumnos.uai.cl') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await connectToDatabase()

  const users = await User.find({}, 'email userId lastLogin updatedAt createdAt')

  return NextResponse.json({ users })
}
