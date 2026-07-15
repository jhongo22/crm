"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../types';
import { 
  Users, 
  MessageCircle, 
  LayoutDashboard, 
  Trello, 
  ClipboardList,
  Box
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
}

const routeMap: Record<string, string> = {
  dashboard: '/dashboard',
  contacts: '/contacts',
  chat: '/chat',
  pipeline: '/pipeline',
  pedidos: '/pedidos',
  ordenes: '/ordenes',
};

export function MobileNav({ activeTab }: MobileNavProps) {
  const router = useRouter();

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contactos', icon: Users },
    { id: 'chat', label: 'Mensajes', icon: MessageCircle, badge: 3 },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
    { id: 'ordenes', label: 'Ordenes', icon: Box },
    { id: 'pipeline', label: 'Ventas', icon: Trello },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-slate-200/50 dark:border-slate-800 px-2 flex items-center justify-around z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            const path = routeMap[item.id];
            if (path) router.push(path);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full relative",
            "active:scale-95 transition-all",
            activeTab === item.id
              ? "text-brand"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          {item.badge && (
            <span className="absolute top-2 right-1/4 bg-brand text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-card">
              {item.badge}
            </span>
          )}
          <item.icon size={22} />
          <span className="text-[10px] font-bold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
