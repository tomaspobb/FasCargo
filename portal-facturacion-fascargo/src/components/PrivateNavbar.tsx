'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PrivateNavbar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('userId');
    router.push('/users');
  };

  return (
    <nav className="navbar navbar-light bg-light px-4 py-2 shadow-sm">
      <div className="d-flex align-items-center">
        <Image src="/logo-fascargo.png" alt="Logo FasCargo" width={40} height={40} className="me-2" />
        <span className="fw-bold fs-5 text-primary">FasCargo Chile</span>
      </div>
      <button onClick={logout} className="btn btn-outline-danger rounded-pill">
        Cerrar sesión
      </button>
    </nav>
  );
}
