'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Dit component zorgt ervoor dat de client-side sessie (JWT) wordt ververst
 * zodra de gebruiker op de succespagina komt. Hierdoor springt de status
 * in de Navbar direct naar 'Premium' zonder dat de gebruiker hoeft te herladen.
 */
export default function SessionRefresher() {
  const { update } = useSession();

  useEffect(() => {
    // Forceer een update van de sessie
    update();
  }, [update]);

  return null;
}
