'use client';

import { useAuth } from '@/context/AuthContext';
import PrivateNavbar from './PrivateNavbar';
import PublicNavbar from './PublicNavbar';

export default function NavbarSelector() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <PrivateNavbar /> : <PublicNavbar />;
}
