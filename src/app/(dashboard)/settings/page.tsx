"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../../../components/shared/Avatar';
import { Button } from '../../../components/shared/Button';
import { User as UserIcon, Radio, Settings as SettingsIcon } from 'lucide-react';

const ChannelsTab = dynamic(() => import('../../../components/settings/ChannelsTab').then(m => m.ChannelsTab), { ssr: false });

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const [subTab, setSubTab] = useState<'profile' | 'channels'>('profile');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase underline decoration-blue-600 decoration-4 underline-offset-8">Ajustes Generales</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Gestiona tu perfil de usuario, preferencias y canales de comunicación del CRM.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-205 dark:border-slate-800">
          <button
            onClick={() => setSubTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'profile'
                ? 'bg-white dark:bg-slate-805 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <UserIcon size={12} />
            <span>Mi Perfil</span>
          </button>
          <button
            onClick={() => setSubTab('channels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'channels'
                ? 'bg-white dark:bg-slate-805 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Radio size={12} className={subTab === 'channels' ? 'text-emerald-500 animate-pulse' : ''} />
            <span>Canales</span>
          </button>
        </div>
      </div>

      {subTab === 'profile' ? (
        <div className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800/60">
            <Avatar name={state.currentUser?.name || ''} size="xl" className="shadow-2xl ring-4 ring-blue-500/10" />
            <div className="text-center md:text-left flex-1">
               <h2 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{state.currentUser?.name}</h2>
               <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase">{state.currentUser?.role}</p>
               <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                     <p className="text-sm font-bold text-slate-700 dark:text-white">{state.currentUser?.email}</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                       <p className="text-sm font-bold text-slate-700 dark:text-white">{state.currentUser?.status}</p>
                     </div>
                  </div>
               </div>
            </div>
            <Button variant="primary" className="h-12 px-8 font-black uppercase text-xs tracking-widest">Editar Perfil</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-2 border-blue-600 pl-3">Preferencias de Sistema</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                      <div>
                         <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight italic uppercase">Modo Oscuro</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Activa la interfaz de alto contraste</p>
                      </div>
                      <button 
                        onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                        className={`w-12 h-6 rounded-full transition-all relative ${state.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.darkMode ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800 opacity-50">
                      <div>
                         <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight italic uppercase">Notificaciones Push</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Recibe alertas en tiempo real</p>
                      </div>
                      <button className="w-12 h-6 rounded-full bg-slate-300 relative">
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"></div>
                      </button>
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-2 border-blue-600 pl-3">Seguridad</h3>
                <div className="space-y-4">
                   <Button variant="outline" className="w-full justify-start h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-300">
                      Cambiar Contraseña
                   </Button>
                   <Button variant="danger" className="w-full justify-start h-14 px-5 rounded-2xl border-transparent bg-red-50 dark:bg-rose-955 text-red-650 hover:bg-red-100 font-bold uppercase text-[10px] tracking-widest">
                      Cerrar todas las sesiones
                   </Button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <ChannelsTab />
      )}
    </div>
  );
}
