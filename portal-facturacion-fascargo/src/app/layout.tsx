// src/app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Facturación | FasCargo',
  description: 'Sistema de gestión de facturas FasCargo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          defer
        ></script>
      </head>
      <body className="bg-light text-dark" style={{ minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
