"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, RefreshCw, MessageSquare, CheckCircle, ChevronRight, User, Phone, MapPin, ExternalLink } from 'lucide-react';
import { HokoOrder } from '../../../../types';
import { Button } from '../../../../components/shared/Button';
import { useRouter } from 'next/navigation';

export default function HokoNovedadesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<HokoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<HokoOrder | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solving, setSolving] = useState(false);

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

  const fetchNovedades = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/novedades', { cache: 'no-store' });
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
    fetchNovedades();
  }, []);

  const handleSolveNovedad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !solutionText) return;
    setSolving(true);
    try {
      const updatedCustomer = { ...selectedOrder.customer, address: `${selectedOrder.customer.address} - NOTA LOGISTICA: ${solutionText}` };
      const formData = new FormData();
      formData.append('customer', JSON.stringify(updatedCustomer));
      formData.append('contain', selectedOrder.contain || 'gps');
      formData.append('measures', JSON.stringify(selectedOrder.measures || { height: "10", width: "10", length: "10", weight: "1" }));

      formData.append('_endpoint', `/member/order/update/${selectedOrder.id}`);
      formData.append('_method', 'POST');

      const res = await fetch('/api/hoko', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      alert('Solución a novedad registrada correctamente en la malla de la transportadora.');
      setSelectedOrder(null);
      setSolutionText('');
      fetchNovedades();
    } catch (err) {
      console.error(err);
      alert('Error al registrar solución.');
    } finally {
      setSolving(false);
    }
  };

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
            Gestión de <span className="text-brand">Novedades</span>
          </h1>
          <p className="text-text-muted font-medium text-xs mt-1">Resuelve problemas de dirección, teléfono y logística de guías retenidas por transportadoras.</p>
        </div>
        <Button variant="secondary" onClick={fetchNovedades} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin mr-1" : "mr-1"} size={16} />
          Actualizar
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar novedades por cliente o guía..."
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
          Error al consultar novedades: {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm text-center py-12 rounded-xl text-text-muted text-sm font-medium flex flex-col items-center gap-2">
          <CheckCircle className="text-success" size={24} />
          ¡Felicidades! No hay novedades pendientes de solución con las transportadoras.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((o) => (
            <div key={o.id} className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] bg-warning-bg text-warning px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Novedad Pendiente
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
                </div>

                <div className="mt-4 bg-warning-bg/50 border border-warning/20 rounded-xl p-3 text-xs text-warning">
                  <strong>Comentario de la Transportadora:</strong> Dirección incompleta o cliente ausente. Requiere confirmación de datos para re-despacho.
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-text-muted">
                  {((o as any).shopify_order_id && ((o as any).shopify_order_id.startsWith('gid://shopify/') || (o as any).shopify_order_id.startsWith('cliente_tienda_pedido_') || /^\d+$/.test((o as any).shopify_order_id))) ? (
                    <button
                      onClick={() => router.push(`/pedidos/shopify/${encodeURIComponent((o as any).shopify_order_id)}`)}
                      className="inline-flex items-center gap-1 text-brand font-black hover:underline"
                    >
                      <ExternalLink size={10} className="text-brand/70" />
                      <span>Pedido: {(o as any).shopify_order_name || (o as any).shopify_order_id.split('/').pop() || (o as any).shopify_order_id} (Hoko: #{o.id})</span>
                    </button>
                  ) : (
                    (o as any).shopify_order_name ? `Pedido: ${(o as any).shopify_order_name} (Hoko: #${o.id})` : `Orden Hoko: #${o.id}`
                  )}
                </span>
                <Button variant="primary" size="sm" onClick={() => setSelectedOrder(o)}>
                  Dar Solución
                  <ChevronRight size={12} className="ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Solve Novedad Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-slate-200/50 dark:border-slate-800 rounded-2xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
            <h2 className="text-lg font-black italic mb-4 text-text-primary uppercase flex items-center gap-2">
              <MessageSquare className="text-warning" size={20} />
              Solución de Novedad <span className="text-brand">#{selectedOrder.id}</span>
            </h2>

            <form onSubmit={handleSolveNovedad} className="space-y-4">
              <div className="text-xs text-text-secondary space-y-1 bg-card-alt border border-slate-100 dark:border-slate-800 p-3 rounded-xl font-medium">
                <p><strong>Destinatario:</strong> {selectedOrder.customer?.name}</p>
                <p><strong>Dirección Actual:</strong> {selectedOrder.customer?.address}</p>
                <p><strong>Teléfono:</strong> {selectedOrder.customer?.phone}</p>
              </div>

              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-2">Instrucciones de Solución / Datos Corregidos</label>
                <textarea
                  rows={4}
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Ej: Corregir dirección a Carrera 45 #12-34. Entregar a portería o llamar al número alternativo..."
                  className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setSelectedOrder(null)} disabled={solving}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={solving}>
                  {solving ? 'Enviando...' : 'Transmitir Solución'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
