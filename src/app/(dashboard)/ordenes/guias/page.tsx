"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Search, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { HokoOrder, HOKO_GUIDE_STATES_CO } from '../../../../types';
import { Button } from '../../../../components/shared/Button';
import { useRouter } from 'next/navigation';

export default function HokoGuiasPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<HokoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<HokoOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pedidos', { cache: 'no-store' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOrders(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const data = await hokoFetch(`/member/order/${orderId}`);
      setSelectedOrder(data.data || data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const getGuideStateLabel = (stateCode: number | string) => {
    return HOKO_GUIDE_STATES_CO[Number(stateCode)] || `Estado (${stateCode})`;
  };

  const getGuideStateStyle = (stateCode: string | number) => {
    const s = String(stateCode);
    switch (s) {
      case '3':
      case '17':
      case '19':
        return 'bg-success-bg text-success border border-success/20';
      case '0':
      case '4':
      case '11':
      case '20':
        return 'bg-danger-bg text-danger border border-danger/20';
      case '6':
      case '18':
      case '21':
        return 'bg-warning-bg text-warning border border-warning/20';
      case '2':
      case '7':
      case '9':
      case '13':
        return 'bg-info-bg text-info border border-info/20';
      default:
        return 'bg-brand-bg text-brand border border-brand/20';
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!o.guide?.number && !(o as any).guide_id && !(o as any).guide_number) return false;
    const num = (o.guide?.number || (o as any).guide_id || (o as any).guide_number || '').toString().toLowerCase();
    const name = (o.customer?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return num.includes(query) || name.includes(query);
  });

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
            Guías de <span className="text-brand">Envío</span>
          </h1>
          <p className="text-text-muted font-medium text-xs mt-1">Monitorea y rastrea el estado de las guías de transporte generadas en Hoko.</p>
        </div>
        <Button variant="secondary" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin mr-1" : "mr-1"} size={16} />
          Actualizar
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-4 bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar por número de guía o destinatario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
          />
        </div>
      </div>

      {/* List content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-brand" size={32} />
        </div>
      ) : error ? (
        <div className="bg-danger-bg text-danger text-sm p-4 rounded-xl font-bold">
          Error al obtener las guías: {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm text-center py-12 rounded-xl text-text-muted text-sm font-medium">
          No se encontraron guías de envío generadas.
        </div>
      ) : (
        <div className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800 bg-card-alt text-[9px] uppercase font-black text-text-muted tracking-wider">
                    <th className="px-4 py-3">Guía Hoko</th>
                    <th className="px-4 py-3">Pedido Relacionado</th>
                    <th className="px-4 py-3">Destinatario</th>
                    <th className="px-4 py-3">Transportadora</th>
                    <th className="px-4 py-3">Estado Guía</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-text-secondary font-medium">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-card-alt/50 transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-brand">
                        {o.guide?.number || (o as any).guide_id || 'Generando...'}
                      </td>
                      <td className="px-4 py-4">
                        {((o as any).shopify_order_id && ((o as any).shopify_order_id.startsWith('gid://shopify/') || (o as any).shopify_order_id.startsWith('cliente_tienda_pedido_') || /^\d+$/.test((o as any).shopify_order_id))) ? (
                          <button
                            onClick={() => router.push(`/pedidos/${encodeURIComponent((o as any).shopify_order_id)}`)}
                            className="inline-flex items-center gap-1 text-brand text-xs font-bold hover:underline font-mono"
                          >
                            <ExternalLink size={10} className="text-brand/70" />
                            <span>{(o as any).shopify_order_name || (o as any).shopify_order_id.split('/').pop() || (o as any).shopify_order_id}</span>
                          </button>
                        ) : (
                          <span className="font-mono text-text-secondary">{(o as any).shopify_order_name || `#${o.id}`}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-text-primary">{o.customer?.name || 'Cliente'}</div>
                        <div className="text-[10px] text-text-muted">{o.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        {(o as any).courier?.name || `ID: ${o.courier_id}`}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${getGuideStateStyle(o.guide?.state || '1')}`}>
                          {getGuideStateLabel(o.guide?.state || '1')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="secondary" size="sm" onClick={() => handleViewDetails(o.id.toString())}>
                          <Eye size={12} className="mr-1" />
                          Ver Rastro
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 flex flex-col gap-2.5 hover:bg-hover active:bg-hover transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-brand">
                      {o.guide?.number || (o as any).guide_id || 'Generando...'}
                    </span>
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${getGuideStateStyle(o.guide?.state || '1')}`}>
                      {getGuideStateLabel(o.guide?.state || '1')}
                    </span>
                  </div>

                  <div className="text-[11px] text-text-secondary font-medium">
                    <p className="font-bold text-text-primary">{o.customer?.name || 'Cliente'}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{o.customer?.phone}</p>
                    <p className="mt-0.5">{(o as any).courier?.name || `ID: ${o.courier_id}`}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                    <div>
                      {((o as any).shopify_order_id && ((o as any).shopify_order_id.startsWith('gid://shopify/') || (o as any).shopify_order_id.startsWith('cliente_tienda_pedido_') || /^\d+$/.test((o as any).shopify_order_id))) ? (
                        <button
                          onClick={() => router.push(`/pedidos/${encodeURIComponent((o as any).shopify_order_id)}`)}
                          className="inline-flex items-center gap-1 text-brand font-black hover:underline"
                        >
                          <ExternalLink size={10} />
                          <span>{(o as any).shopify_order_name || (o as any).shopify_order_id.split('/').pop() || (o as any).shopify_order_id}</span>
                        </button>
                      ) : (
                        <span className="font-mono text-text-secondary">{(o as any).shopify_order_name || `#${o.id}`}</span>
                      )}
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleViewDetails(o.id.toString())}>
                      <Eye size={12} className="mr-1" />
                      Ver Rastro
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        </div>
      )}

      {/* Guide Details / Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-slate-200/50 dark:border-slate-800 rounded-2xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
            <h2 className="text-lg font-black italic mb-4 text-text-primary uppercase">
              Rastreo de Guía <span className="text-brand">#{selectedOrder.guide?.number}</span>
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-card-alt border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-xs font-medium text-text-secondary">
                <div>
                  <span className="text-text-muted block mb-0.5">Destinatario</span>
                  <strong className="text-text-primary">{selectedOrder.customer?.name}</strong>
                </div>
                <div>
                  <span className="text-text-muted block mb-0.5">Dirección</span>
                  <strong className="text-text-primary">{selectedOrder.customer?.address}</strong>
                </div>
                <div>
                  <span className="text-text-muted block mb-0.5">Transportadora</span>
                  <strong className="text-text-primary">{(selectedOrder as any).courier?.name || `ID: ${selectedOrder.courier_id}`}</strong>
                </div>
                <div>
                  <span className="text-text-muted block mb-0.5">Estado Actual</span>
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${getGuideStateStyle(selectedOrder.guide?.state || '1')}`}>
                    {getGuideStateLabel(selectedOrder.guide?.state || '1')}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Historial de Tránsito</h3>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  <div className="relative before:absolute before:-left-6 before:top-1 before:w-3.5 before:h-3.5 before:rounded-full before:bg-brand before:border-4 before:border-card">
                    <p className="text-xs font-bold text-text-primary">Guía Generada</p>
                    <p className="text-[10px] text-text-muted">Orden vinculada y pre-despachada exitosamente en Hoko</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
