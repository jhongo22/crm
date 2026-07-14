import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquare, 
  TrendingUp, 
  CheckSquare, 
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  MoreVertical
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function Dashboard() {
  const { state } = useApp();

  const totalPipeline = state.deals.reduce((acc, deal) => acc + deal.value, 0);
  const activeConversations = state.conversations.filter(c => c.status === 'Abierta').length;
  const pendingTasks = state.tasks.filter(t => t.status !== 'Completada').length;
  const newLeads = state.contacts.filter(c => c.status === 'Lead').length;

  const kpis = [
    { label: 'Conversaciones activas', value: activeConversations, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Leads nuevos', value: newLeads, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Tareas pendientes', value: pendingTasks, icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Pipeline total', value: `$${(totalPipeline / 1000000).toFixed(1)}M`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  // Simulated data for charts
  const conversationData = [
    { name: 'WhatsApp', value: 8 },
    { name: 'Email', value: 5 },
    { name: 'Web Chat', value: 4 },
    { name: 'Instagram', value: 3 },
    { name: 'Facebook', value: 2 },
  ];

  const leadsTrendData = [
    { name: 'S1', leads: 4 },
    { name: 'S2', leads: 7 },
    { name: 'S3', leads: 5 },
    { name: 'S4', leads: 9 },
    { name: 'S5', leads: 12 },
    { name: 'S6', leads: 8 },
  ];

  const pipelineStages = [
    { name: 'Nuevo', value: 40000000, color: '#3b82f6' },
    { name: 'Contactado', value: 75000000, color: '#6366f1' },
    { name: 'Propuesta', value: 120000000, color: '#8b5cf6' },
    { name: 'Negociación', value: 85000000, color: '#a855f7' },
  ];

  const handleNav = (id: string) => {
    window.dispatchEvent(new CustomEvent('nav-change', { detail: id }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">¡Hola, {state.currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aquí está lo que está pasando en NovaCRM hoy.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => handleNav('pipeline')}
             className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 transition-transform"
           >
             <Target size={16} /> Nuevo negocio
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{kpi.label}</span>
              <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg`}>
                <kpi.icon size={18} />
              </div>
            </div>
            <div className="z-10">
              <span className="text-2xl font-black dark:text-white tracking-tighter italic">{kpi.value}</span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 mt-1">
                <ArrowUpRight size={12} /> 12% vs mes anterior
              </div>
            </div>
            <div className="absolute -right-2 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <kpi.icon size={100} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Leads nuevos por semana</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><MoreVertical size={16}/></button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Distribución Pipeline</h3>
             <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><MoreVertical size={16}/></button>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineStages}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pipelineStages.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Actividad Reciente</h3>
            <button 
              onClick={() => handleNav('contacts')}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Ver todo
            </button>
          </div>
          <div className="space-y-4">
            {[1,2,3,4].map((item) => (
              <div key={item} className="flex items-start gap-4 pb-4 border-b border-slate-50 last:border-0 dark:border-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-slate-900 dark:text-white">Ana García</span> asignó a Diana Morales a Pedro Ruiz
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">Hace 15 minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Tareas urgentes</h3>
            <button 
              onClick={() => handleNav('tasks')}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Ir a tareas
            </button>
          </div>
          <div className="space-y-3">
            {state.tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                 <div className="flex items-center gap-3 min-w-0">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                   <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.title}</p>
                      <p className="text-[11px] font-bold text-slate-400">Vence hoy, 4:00 PM</p>
                   </div>
                 </div>
                 <CheckSquare className="text-slate-300 group-hover:text-blue-600 transition-colors cursor-pointer" size={18} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
