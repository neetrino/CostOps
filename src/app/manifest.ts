import type { MetadataRoute } from 'next';
import {
  APP_DESCRIPTION,
  APP_NAME,
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
} from '@/config/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: `Neetrino ${APP_NAME}`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'browser'],
    orientation: 'any',
    lang: 'en',
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ['finance', 'business'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
