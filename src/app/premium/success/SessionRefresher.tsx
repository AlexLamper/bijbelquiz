'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

/**
 * Dit component zorgt ervoor dat de client-side sessie (JWT) wordt ververst
 * zodra de gebruiker op de succespagina komt. Hierdoor springt de status
 * in de Navbar direct naar 'Premium' zonder dat de gebruiker hoeft te herladen.
 */
export default function SessionRefresher() {
  const { update } = useSession();
  const hasUpdated = useRef(false);

  useEffect(() => {
    if (hasUpdated.current) {
      return;
    }

    hasUpdated.current = true;
    // Forceer een eenmalige update van de sessie
    update();
  }, [update]);

  return null;
}
