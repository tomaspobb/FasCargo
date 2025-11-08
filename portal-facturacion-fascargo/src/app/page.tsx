// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  // Fuerza la raíz a /auth (login)
  redirect('/auth');
}
