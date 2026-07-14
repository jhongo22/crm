"use client";

import dynamic from 'next/dynamic';

const UserManagement = dynamic(() => import('../../../components/users/UserManagement').then(m => m.UserManagement), { ssr: false });

export default function AdminPage() {
  return <UserManagement />;
}
