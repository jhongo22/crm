import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Grid, 
  List as ListIcon,
  Download,
  Upload,
  UserPlus
} from 'lucide-react';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Avatar } from '../shared/Avatar';

export function ContactList() {
  const { state } = useApp();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = state.contacts.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Contactos</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona tu red de clientes y prospectos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
             <Download size={14} /> Exportar
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
             <Upload size={14} /> Importar
          </Button>
          <Button size="sm" className="w-full sm:w-auto">
             <UserPlus size={16} /> Nuevo contacto
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white dark:focus:bg-slate-800 rounded-xl transition-all text-sm font-medium dark:text-slate-200"
              placeholder="Buscar por nombre, empresa o email..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter size={18} />
            </Button>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
              <button 
                onClick={() => setView('table')}
                className={`p-1.5 rounded-lg transition-all ${view === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                <ListIcon size={18} />
              </button>
              <button 
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Empresa / Cargo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Estado / Score</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Agente</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${contact.firstName} ${contact.lastName}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{contact.firstName} {contact.lastName}</p>
                          <p className="text-[11px] font-medium text-slate-500 truncate">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{contact.company}</p>
                      <p className="text-[11px] font-medium text-slate-500">{contact.role}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge variant={contact.status === 'Cliente activo' ? 'success' : 'warning'}>
                          {contact.status}
                        </Badge>
                        <div className="flex items-center gap-2">
                           <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${contact.score > 80 ? 'bg-green-500' : contact.score > 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                style={{ width: `${contact.score}%` }}
                              ></div>
                           </div>
                           <span className="text-[10px] font-black text-slate-400">{contact.score}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                           {state.users.find(u => u.id === contact.agentId)?.name[0]}
                         </div>
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                           {state.users.find(u => u.id === contact.agentId)?.name.split(' ')[0]}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Mail size={16} /></button>
                         <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Phone size={16} /></button>
                         <button className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><MoreHorizontal size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative group">
               <Avatar name={`${contact.firstName} ${contact.lastName}`} size="lg" className="mb-4 mx-auto" />
               <div className="text-center mb-4">
                 <h3 className="font-bold text-slate-900 dark:text-white truncate">{contact.firstName} {contact.lastName}</h3>
                 <p className="text-xs font-medium text-slate-500 mb-2 truncate">{contact.company}</p>
                 <Badge variant={contact.status === 'Cliente activo' ? 'success' : 'default'} size="sm">
                   {contact.status}
                 </Badge>
               </div>
               <div className="flex justify-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><Phone size={16}/></Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><Mail size={16}/></Button>
                  <Button variant="ghost" size="sm" className="flex-1 font-bold">Ver Perfil</Button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
