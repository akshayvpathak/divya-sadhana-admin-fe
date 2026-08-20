import type { MetadataRoute } from 'next';

/**
 * Served at /manifest.webmanifest. Gives Android/Chrome a real icon when the
 * console is pinned or installed, instead of a screenshot of the first paint.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Divya Sadhana · Admin',
    short_name: 'Divya Sadhana',
    description: 'Administration console for Divya Sadhana',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#faf7fb', // --page
    theme_color: '#2b1b45', // --royal-deep, matches the sidebar
    icons: [
      {
        src: '/brand/divyasadhana-seal-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/divyasadhana-seal-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
