import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import NavbarSelector from '@/components/Navbar/NavbarSelector';
import Footer from '@/components/Footer'; // Asegúrate de que existe en esa ruta

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
          <NavbarSelector />
          <main className="flex-grow-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
