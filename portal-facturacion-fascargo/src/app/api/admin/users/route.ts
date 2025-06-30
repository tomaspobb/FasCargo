// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { User } from '@/models/User'

// 🔥 DELETE → Eliminar usuario por userId (solo admin)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const userId = searchParams.get('userId')

  if (email !== 'topoblete@alumnos.uai.cl') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  await connectToDatabase()

  const deleted = await User.findOneAndDelete({ userId })

  if (!deleted) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Usuario eliminado correctamente' })
}
