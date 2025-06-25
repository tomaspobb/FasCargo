'use client';

import Image from 'next/image';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  return (
    <main>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <Image
              src="/logo-fascargo.png"
              alt="Logo FasCargo"
              width={50}
              height={50}
              style={{ objectFit: 'contain' }}
              className="me-2"
            />
            <span className="fw-bold fs-4 text-primary">Portal Facturación</span>
          </a>
        </div>
      </nav>

      {/* WELCOME SECTION */}
      <section className="container text-center py-5">
        <h1 className="display-4 fw-bold text-dark mb-3">
          Bienvenido al <span className="text-primary">Portal de Facturación</span>
        </h1>
        <p className="lead text-secondary mb-4">
          Carga, consulta y administra tus facturas de forma rápida, ordenada y segura.
        </p>

        <div className="d-flex justify-content-center gap-3 mt-4">
          <button className="btn btn-primary btn-lg px-4">Ingresar al sistema</button>
          <button className="btn btn-outline-primary btn-lg px-4">Ver facturas</button>
        </div>
      </section>
    </main>
  );
}
