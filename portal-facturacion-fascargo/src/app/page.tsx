'use client';

import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  return (
    <main>
      {/* WELCOME SECTION */}
      <section className="container text-center py-5">
        <h1 className="display-4 fw-bold text-dark mb-3">
          Bienvenido al <span className="text-primary">Portal de Facturación</span>
        </h1>
        <p className="lead text-secondary mb-4">
          Carga, consulta y administra tus facturas de forma rápida, ordenada y segura.
        </p>

        <div className="d-flex justify-content-center gap-3 mt-4">
          <Link href="/login" className="btn btn-primary btn-lg px-4">
            Ingresar al sistema
          </Link>
          <Link href="/dashboard" className="btn btn-outline-primary btn-lg px-4">
            Ver facturas
          </Link>
        </div>
      </section>
    </main>
  );
}
