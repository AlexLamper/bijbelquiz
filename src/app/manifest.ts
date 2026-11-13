import type { MetadataRoute } from 'next';

/** Web app manifest: the same icon as the app (lapis tile, open book with a question mark). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BijbelQuiz',
    short_name: 'BijbelQuiz',
    description: 'Test je Bijbelkennis met korte quizzen over elk bijbelboek.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#35548C',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
