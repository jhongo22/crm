import React from 'react';
import '../index.css';
import { AppProvider } from '../context/AppContext';
import { AuthGuard } from '../components/auth/AuthGuard';

export const metadata = {
  title: 'Winners Hub',
  description: 'Sistema de gestión de clientes y pedidos - Winners Hub',
  icons: {
    icon: '/icono-fabrica-winners-sin-fondo.png',
    apple: '/icono-fabrica-winners.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AppProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AppProvider>
      </body>
    </html>
  );
}
