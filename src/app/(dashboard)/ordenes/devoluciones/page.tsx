"use client";

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, Calendar, User, Phone, MapPin } from 'lucide-react';
import { HokoOrder } from '../../../../types';
import { Button } from '../../../../components/shared/Button';

export default function HokoDevolucionesPage() {
  const [orders, setOrders] = useState<HokoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const hokoFetch = async (endpoint: string, options?: { method?: string; body?: any }) => {
    const res = await fetch('/api/hoko', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        method: options?.method || 'GET',
        body: options?.body,
      }),
    });
    return res.json();
  };

  const fetchDevoluciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hokoFetch('/member/order');
      if (data.error) throw new Error(data.error);
      const list: HokoOrder[] = data.data || data.orders || [];
      setOrders([]);

      // Fetch details in parallel
      await Promise.all(list.map(async (order) => {
        try {
          const detail = await hokoFetch(`/member/order/${order.id}`);
          const fullOrder = { ...order, ...(detail.data || detail) };
          if (fullOrder.guide?.state === '11' || fullOrder.guide?.state === '20') {
            setOrders(prev => {
              if (prev.some(o => o.id === fullOrder.id)) return prev;
              return [...prev, fullOrder];
            });
          }
        } catch (e) {
          console.error(e);
        }
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevoluciones();
  }, []);

  const filtered = orders.filter((o) => {
    const name = (o.customer?.name || '').toLowerCase();
    const guideNum = (o.guide?.number || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || guideNum.includes(query);
  });

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
            Control de <span className="text-brand">Devoluciones</span>
          </h1>
          <p className="text-text-muted font-medium text-xs mt-1">Monitorea y gestiona las órdenes Hoko en estado de devolución.</p>
        </div>
        <Button variant="secondary" onClick={fetchDevoluciones} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin mr-1" : "mr-1"} size={16} />
          Actualizar
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar devoluciones por nombre o número de guía..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-brand" size={32} />
        </div>
      ) : error ? (
        <div className="bg-danger-bg text-danger text-sm p-4 rounded-xl font-bold">
          Error al consultar devoluciones: {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm text-center py-12 rounded-xl text-text-muted text-sm font-medium flex flex-col items-center gap-2">
          <AlertCircle className="text-text-muted" size={24} />
          No hay devoluciones registradas o en tránsito en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((o) => (
            <div key={o.id} className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] bg-danger-bg text-danger px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                    {o.guide?.state === '20' ? 'Devolución Cobrada' : 'En Devolución'}
                  </span>
                  <span className="text-xs text-text-muted font-mono font-bold">Guía: {o.guide?.number}</span>
                </div>

                <h3 className="text-md font-bold text-text-primary flex items-center gap-2">
                  <User size={16} className="text-text-muted" />
                  {o.customer?.name}
                </h3>

                <div className="mt-4 space-y-2 text-xs text-text-secondary font-medium">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-text-muted" />
                    {o.customer?.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-text-muted" />
                    {o.customer?.address}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] pt-1 text-text-muted">
                    <Calendar size={13} />
                    {o.created_at || 'Fecha no disponible'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-text-muted">Hoko ID: #{o.id}</span>
                <span className="text-xs font-mono font-bold text-text-primary">
                  Flete Tienda: ${o.guide?.total_freight_store?.toLocaleString()} COP
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
