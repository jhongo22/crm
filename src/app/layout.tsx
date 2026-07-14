import React from 'react';
import '../index.css';
import { AppProvider } from '../context/AppContext';
import { AuthGuard } from '../components/auth/AuthGuard';

export const metadata = {
  title: 'CRM Specialist',
  description: 'CRM especializado para mi negocio',
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
