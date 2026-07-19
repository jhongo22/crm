"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ContactList = dynamic(() => import('../../../components/contacts/ContactList').then(m => m.ContactList), { ssr: false });

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        <p className="text-text-muted text-xs">Cargando Clientes...</p>
      </div>
    }>
      <ContactList />
    </Suspense>
  );
}
