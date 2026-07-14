import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  ArrowRight, 
  DollarSign, 
  Calendar,
  AlertCircle,
  MoreVertical,
  Grab
} from 'lucide-react';
import { DealStage, Deal } from '../../types';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Avatar } from '../shared/Avatar';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STAGES: DealStage[] = [
  'Nuevo lead',
  'Contactado',
  'Propuesta enviada',
  'Negociación',
  'Cerrado ganado',
  'Cerrado perdido'
];

interface SortableDealProps {
  deal: Deal;
  contact?: any;
  agent?: any;
  formatCurrency: (val: number) => string;
  key?: any;
}

function SortableDealCard({ deal, contact, agent, formatCurrency }: SortableDealProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start mb-3">
         <Badge variant={deal.probability > 70 ? 'success' : 'info'} size="sm">
           {deal.probability}%
         </Badge>
         <button className="text-slate-300 group-hover:text-slate-500"><MoreVertical size={14}/></button>
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">{deal.title}</h4>
      <p className="text-[11px] font-bold text-slate-500 mb-4">{contact?.company}</p>
      
      <div className="space-y-3">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-900 dark:text-white font-black text-sm tracking-tighter">
               {formatCurrency(deal.value)}
            </div>
            <Avatar name={agent?.name || ''} size="sm" />
         </div>
         
         <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${deal.probability}%` }}></div>
         </div>

         <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 text-slate-400">
               <Calendar size={12} />
               <span className="text-[10px] font-bold">15/Jul</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-500">
               <AlertCircle size={12} />
               <span className="text-[10px] font-black uppercase">7 días</span>
            </div>
         </div>
      </div>
    </div>
  );
}

export function PipelineBoard() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredDeals = state.deals.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeDeal = state.deals.find(d => d.id === active.id);
    const overId = over.id as string;

    // logic to move between stages
    if (STAGES.includes(overId as DealStage)) {
       if (activeDeal && activeDeal.stage !== overId) {
          dispatch({ type: 'UPDATE_DEAL_STAGE', payload: { dealId: activeDeal.id, stage: overId as DealStage } });
       }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeDeal = state.deals.find(d => d.id === active.id);
    if (!activeDeal) return;

    let targetStage: DealStage = activeDeal.stage;

    // Check if dropped on a stage
    if (STAGES.includes(over.id as DealStage)) {
       targetStage = over.id as DealStage;
    } else {
       // Check if dropped on another deal
       const overDeal = state.deals.find(d => d.id === over.id);
       if (overDeal) targetStage = overDeal.stage;
    }

    if (activeDeal.stage !== targetStage) {
       dispatch({ type: 'UPDATE_DEAL_STAGE', payload: { dealId: activeDeal.id, stage: targetStage } });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Sales Pipeline</h1>
             <Badge variant="info">Activo</Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona tus oportunidades de venta de forma visual.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline">
             <Filter size={18} /> Filtrar
           </Button>
           <Button variant="primary">
             <Plus size={18} /> Nuevo negocio
           </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute inset-y-0 left-3 flex items-center h-full text-slate-400 font-bold" />
          <input 
            type="text" 
            placeholder="Buscar negocios..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:bg-white outline-none dark:text-white transition-all shadow-inner" 
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
           <button className="p-1 px-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-blue-600"><LayoutGrid size={18}/></button>
           <button className="p-1 px-2 rounded-lg text-slate-400"><List size={18}/></button>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-6 h-full min-w-max pb-4">
            {STAGES.map((stage) => {
              const stageDeals = filteredDeals.filter(d => d.stage === stage);
              const stageTotal = stageDeals.reduce((acc, d) => acc + d.value, 0);

              return (
                <div key={stage} className="w-72 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{stage}</h3>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-500">{stageDeals.length}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-tighter italic">{formatCurrency(stageTotal)}</span>
                  </div>

                  <SortableContext id={stage} items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-2 space-y-3 min-h-[500px] border border-transparent transition-colors hover:border-slate-200 dark:hover:border-slate-800">
                      {stageDeals.map((deal) => (
                        <SortableDealCard 
                          key={deal.id} 
                          deal={deal} 
                          contact={state.contacts.find(c => c.id === deal.contactId)}
                          agent={state.users.find(u => u.id === deal.responsibleId)}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                           <Grab size={24} className="text-slate-300 mb-2" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Suelta aquí</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
           {activeId ? (
             <div className="opacity-80 scale-105 rotate-2 shadow-2xl ring-2 ring-blue-500">
               <SortableDealCard 
                 deal={state.deals.find(d => d.id === activeId)!} 
                 contact={state.contacts.find(c => c.id === state.deals.find(d => d.id === activeId)?.contactId)}
                 agent={state.users.find(u => u.id === state.deals.find(d => d.id === activeId)?.responsibleId)}
                 formatCurrency={formatCurrency}
               />
             </div>
           ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
