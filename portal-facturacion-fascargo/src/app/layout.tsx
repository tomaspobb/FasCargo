// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AdminProvider } from '@/context/AdminContext'; // ⬅️ NUEVO
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppFrame from '@/components/AppFrame';

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
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css"
        />
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          defer
        ></script>
      </head>

      <body className="bg-light text-dark d-flex flex-column min-vh-100">
        <AuthProvider>
          {/* ⬇️ Inyecta el contexto admin global */}
          <AdminProvider>
            {/* 🔒 AppFrame encapsula guard + navbar/footer condicionales */}
            <AppFrame>{children}</AppFrame>

            {/* ✅ Toasts globales */}
            <ToastContainer
              position="bottom-right"
              autoClose={2500}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              pauseOnHover
              draggable
              theme="colored"
            />
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
