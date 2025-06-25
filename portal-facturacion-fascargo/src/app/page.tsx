// src/app/page.tsx
'use client';

import Image from 'next/image';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  return (
    <main>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm px-3">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <Image
            src="/logo-fascargo.png"
            alt="FasCargo Logo"
            width={40}
            height={40}
            className="me-2"
          />
          <span className="fs-5 fw-bold text-white">Portal Facturación</span>
        </a>
      </nav>

      {/* WELCOME CONTENT */}
      <div className="container text-center mt-5">
        <h1 className="display-5 fw-bold">Bienvenido al Portal de Facturación</h1>
        <p className="lead text-muted">
          Aquí podrás cargar, consultar y administrar tus facturas de forma rápida y segura.
        </p>
        <hr />
        <div className="d-flex justify-content-center gap-4 mt-4">
          <button className="btn btn-primary btn-lg">Ingresar al sistema</button>
          <button className="btn btn-outline-secondary btn-lg">Ver facturas</button>
        </div>
      </div>
    </main>
  );
}
