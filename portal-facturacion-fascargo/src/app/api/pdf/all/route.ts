import { connectToDatabase } from '@/lib/mongodb';
import { Pdf } from '@/models/Pdf';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectToDatabase();
  const all = await Pdf.find().sort({ createdAt: -1 });
  return NextResponse.json(all);
}
