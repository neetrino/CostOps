'use client';

import { useEffect } from 'react';

/**
 * Registers the root service worker in production builds only.
 * Unregisters leftovers in development so a previous install cannot cache local HTML.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        );
      return;
    }

    void navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }, []);

  return null;
}
