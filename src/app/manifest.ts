import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Winners Hub',
    short_name: 'Winners Hub',
    description: 'Sistema de gestión de clientes y pedidos - Winners Hub',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    orientation: 'portrait',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/logo-crm.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo-crm.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-crm.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
