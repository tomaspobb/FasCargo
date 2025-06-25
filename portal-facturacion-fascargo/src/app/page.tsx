'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-light">
      <section className="container text-center py-5">
        <h1 className="display-5 fw-bold text-dark mb-3">
          Gestión de <span className="text-primary">Facturación</span>
        </h1>
        <p className="text-secondary mb-4">
          Plataforma interna para gestionar tus facturas de forma simple, ordenada y segura.
        </p>

        <div className="d-flex justify-content-center gap-3 mt-4">
          <Link href="/login" className="btn btn-primary btn-lg px-4 rounded-pill shadow-sm">
            Ingresar al sistema
          </Link>
          <Link href="/dashboard" className="btn btn-outline-primary btn-lg px-4 rounded-pill">
            Ver facturas
          </Link>
        </div>
      </section>
    </main>
  );
}
