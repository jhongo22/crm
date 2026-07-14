"use client";

import dynamic from 'next/dynamic';

const ContactList = dynamic(() => import('../../../components/contacts/ContactList').then(m => m.ContactList), { ssr: false });

export default function ContactsPage() {
  return <ContactList />;
}
