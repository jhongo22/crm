import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  MoreVertical,
  AlertCircle,
  User,
  Trash2
} from 'lucide-react';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { TaskStatus, TaskPriority, Task } from '../../types';

export function TaskList() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');

  const filteredTasks = state.tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleTaskStatus = (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === 'Completada' ? 'Pendiente' : 'Completada';
    dispatch({ type: 'UPDATE_TASK_STATUS', payload: { taskId, status: newStatus } });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Alta': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'Media': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'Baja': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const deleteTask = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      dispatch({ type: 'DELETE_TASK', payload: id });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Tareas</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Organiza tu día y el de tu equipo.</p>
        </div>
        <Button onClick={() => alert('Funcionalidad de nueva tarea próximamente')}>
          <Plus size={18} /> Nueva tarea
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute inset-y-0 left-3 flex items-center h-full text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar tareas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl focus:ring-2 focus:ring-blue-600/20 outline-none text-sm font-medium transition-all"
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
           {['All', 'Pendiente', 'En progreso', 'Completada'].map((status) => (
             <button
               key={status}
               onClick={() => setFilterStatus(status as any)}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterStatus === status ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
             >
               {status === 'All' ? 'Todas' : status}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-20 text-center space-y-4">
             <CheckCircle2 size={48} className="mx-auto text-slate-200" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay tareas que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.map((task) => {
              const contact = state.contacts.find(c => c.id === task.contactId);
              const assigned = state.users.find(u => u.id === task.assignedId);
              
              return (
                <div key={task.id} className={`p-4 flex items-start gap-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30 group ${task.status === 'Completada' ? 'opacity-60' : ''}`}>
                  <button 
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`mt-1 transition-colors ${task.status === 'Completada' ? 'text-green-500' : 'text-slate-300 hover:text-blue-500'}`}
                  >
                    {task.status === 'Completada' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-bold truncate tracking-tight transition-all ${task.status === 'Completada' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </h4>
                      <Badge variant={task.priority === 'Alta' ? 'danger' : task.priority === 'Media' ? 'warning' : 'info'} size="sm">
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400 uppercase">
                      {contact && (
                        <div className="flex items-center gap-1">
                          <User size={12} className="text-slate-300" />
                          <span className="truncate">{contact.firstName} {contact.lastName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-300" />
                        <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[8px] font-black text-slate-500">
                          {assigned?.name[0]}
                        </div>
                        <span>Asignado: {assigned?.name.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
