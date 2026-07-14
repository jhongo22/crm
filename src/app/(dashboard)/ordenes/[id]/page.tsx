"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, RefreshCw, User, MapPin, Package,
  Truck, FileText, ClipboardList, X
} from 'lucide-react';
import { HokoOrder, HokoCity, HOKO_ORDER_STATES, HOKO_GUIDE_STATES_CO } from '../../../../types';
import { Button } from '../../../../components/shared/Button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HokoPedidoDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<HokoOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cities, setCities] = useState<HokoCity[]>([]);

  // Edit form state
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerEmail: '',
    customerIdentification: '',
    customerPhone: '',
    customerAddress: '',
    cityId: '',
    contain: '',
    height: '10',
    width: '10',
    length: '10',
    weight: '1',
  });

  const hokoFetch = async (endpoint: string, options?: { method?: string; body?: any; formData?: FormData }) => {
    const res = await fetch('/api/hoko', {
      method: 'POST',
      headers: options?.formData ? {} : { 'Content-Type': 'application/json' },
      body: options?.formData || JSON.stringify({
        endpoint,
        method: options?.method || 'GET',
        body: options?.body,
      }),
    });
    return res.json();
  };

  const hokoFormFetch = async (endpoint: string, formData: FormData) => {
    formData.set('_endpoint', endpoint);
    formData.set('_method', 'POST');
    const res = await fetch('/api/hoko', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  };

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const data = await hokoFetch(`/member/order/${orderId}`);
      const orderData = data.data || data;
      setOrder(orderData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const data = await hokoFetch('/member/get-cities');
      setCities(data.data || data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  // Helpers for badge styles
  const stateColor = (state: string) => {
    switch (state) {
      case '4': // Finalizada
        return 'bg-success-bg text-success border border-success/20';
      case '5': // Cancelada
        return 'bg-danger-bg text-danger border border-danger/20';
      case '6': // En Novedad
        return 'bg-warning-bg text-warning border border-warning/20';
      case '2': // En proceso
      case '3': // Despachada
        return 'bg-info-bg text-info border border-info/20';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const guideStateColor = (state: string | number) => {
    const s = String(state);
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

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) return;
    setActionLoading(orderId);
    try {
      const data = await hokoFetch(`/member/order/cancel/${orderId}`, { method: 'POST' });
      if (data.error) throw new Error(data.error);
      alert('Orden cancelada');
      router.push('/ordenes');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateGuide = async () => {
    setActionLoading(orderId);
    try {
      const data = await hokoFetch(`/member/order/generate-guide/${orderId}`, { method: 'POST' });
      if (data.error) throw new Error(data.error);
      alert('Guía generada exitosamente');
      fetchOrderDetail();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEdit = () => {
    if (!order) return;
    setEditForm({
      customerName: order.customer?.name || '',
      customerEmail: order.customer?.email || '',
      customerIdentification: order.customer?.identification || '',
      customerPhone: order.customer?.phone || '',
      customerAddress: order.customer?.address || '',
      cityId: (order as any).city_id || '',
      contain: order.contain || '',
      height: order.measures?.height || '10',
      width: order.measures?.width || '10',
      length: order.measures?.length || '10',
      weight: order.measures?.weight || '1',
    });
    fetchCities();
    setShowEdit(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setEditing(true);
    try {
      const formData = new FormData();
      
      const customerJSON = JSON.stringify({
        name: editForm.customerName,
        email: editForm.customerEmail,
        identification: editForm.customerIdentification,
        phone: editForm.customerPhone,
        address: editForm.customerAddress,
        city_id: editForm.cityId,
      });

      const measuresJSON = JSON.stringify({
        height: editForm.height,
        width: editForm.width,
        length: editForm.length,
        weight: editForm.weight,
      });

      formData.append('customer', customerJSON);
      formData.append('contain', editForm.contain);
      formData.append('measures', measuresJSON);

      const data = await hokoFormFetch(`/member/order/update/${order.id}`, formData);
      if (data.error) throw new Error(data.error);

      alert('Orden actualizada con éxito.');
      setShowEdit(false);
      fetchOrderDetail();
    } catch (err: any) {
      alert(`Error al actualizar orden: ${err.message}`);
    } finally {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-24 text-center">
        <RefreshCw className="animate-spin text-brand mx-auto" size={32} />
        <p className="text-text-muted font-bold text-base mt-4">Cargando detalles de la orden...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-24 text-center space-y-4">
        <p className="text-text-muted font-bold text-lg">No se encontró la orden.</p>
        <Button variant="primary" onClick={() => router.push('/ordenes')}>Volver a órdenes</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-4 md:px-8 py-6 animate-in fade-in duration-500">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/ordenes')}
            className="p-2.5 rounded-xl hover:bg-card-alt text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-text-primary">Orden #{order.id}</h2>
              <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${stateColor(order.delivery_state)}`}>
                {HOKO_ORDER_STATES[order.delivery_state] || order.delivery_state}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1 font-semibold">
              Creada: {order.created_at ? new Date(order.created_at).toLocaleString('es-CO') : '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {order.external_id && (
            <Button variant="outline" onClick={() => router.push(`/pedidos/${encodeURIComponent(order.external_id!)}`)}
              className="h-10 px-4 text-xs flex items-center gap-1.5 font-bold">
              <ExternalLink size={14} />
              <span>Ver Shopify</span>
            </Button>
          )}
          
          {(order.delivery_state === '1' || order.delivery_state === '2') && (
            <Button variant="outline" onClick={handleOpenEdit}
              className="h-10 px-4 text-xs border-brand/20 text-brand hover:bg-brand-bg font-bold font-bold">
              Editar orden
            </Button>
          )}

          <Button variant="outline" onClick={handleCancel}
            disabled={actionLoading === order.id}
            className="h-10 px-4 text-xs border-danger/20 text-danger hover:bg-danger-bg font-bold">
            {actionLoading === order.id ? '...' : 'Cancelar orden'}
          </Button>
          <Button variant="primary" onClick={handleGenerateGuide}
            disabled={actionLoading === order.id}
            className="h-10 px-4 text-xs font-bold">
            {actionLoading === order.id ? '...' : 'Generar guía'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Panel: Cliente, Despacho y Productos */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Cliente & Destino Side-by-Side */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              
              {/* Left Side: Datos del Cliente */}
              <div className="space-y-5 pr-0 md:pr-8">
                <h3 className="font-black text-sm uppercase tracking-wider text-text-primary flex items-center gap-2.5">
                  <User size={16} className="text-brand" />
                  <span>Destinatario</span>
                </h3>
                {order.customer ? (
                  <div className="text-sm space-y-3 font-semibold text-text-secondary">
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Nombre</span>
                      <span className="font-black text-text-primary text-base">{order.customer.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Identificación</span>
                        <span className="text-text-primary font-black">{order.customer.identification || '—'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Teléfono</span>
                        <span className="text-text-primary font-black">{order.customer.phone || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Correo Electrónico</span>
                      <span className="text-text-primary font-black">{order.customer.email || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted italic">Sin datos de cliente</p>
                )}
              </div>

              {/* Right Side: Datos de Despacho */}
              <div className="space-y-5 pt-5 md:pt-0 pl-0 md:pl-8">
                <h3 className="font-black text-sm uppercase tracking-wider text-text-primary flex items-center gap-2.5">
                  <MapPin size={16} className="text-brand" />
                  <span>Logística y Destino</span>
                </h3>
                <div className="text-sm space-y-3 font-semibold text-text-secondary">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Dirección de Entrega</span>
                    <span className="font-bold text-text-primary">{order.customer?.address || '—'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Ciudad Destino</span>
                      <span className="text-text-primary font-black uppercase">{(order as any).city || '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Bodega de Despacho</span>
                      <span className="text-text-primary font-black">ID #{order.cellar_id || '—'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Método de Recaudo</span>
                      <span className="text-text-primary font-black">
                        {order.payment === '1' ? 'Contra entrega' : order.payment === '2' ? 'Ordinario' : `Cód: ${order.payment}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Valor Declarado</span>
                      <span className="text-text-primary font-black text-base">${order.declared_value ? parseInt(order.declared_value).toLocaleString('es-CO') : '0'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Products Card */}
          {(order as any).products && (order as any).products.length > 0 && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-md p-8 space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-text-primary flex items-center gap-2.5">
                <Package size={16} className="text-brand" />
                <span>Productos Despachados</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-text-muted uppercase">
                      <th className="pb-3 font-black">Stock ID</th>
                      <th className="pb-3 text-right font-black">Cantidad</th>
                      <th className="pb-3 text-right font-black">Precio Unitario</th>
                      <th className="pb-3 text-right font-black">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {(order as any).products.map((p: any, idx: number) => {
                      const qty = parseInt(p.amount || '0');
                      const price = parseFloat(p.price_unity || '0');
                      return (
                        <tr key={idx} className="text-text-secondary">
                          <td className="py-3 font-black text-text-primary">#{p.stock_id}</td>
                          <td className="py-3 text-right font-black">{qty}</td>
                          <td className="py-3 text-right">${price.toLocaleString('es-CO')}</td>
                          <td className="py-3 text-right font-black text-text-primary">${(price * qty).toLocaleString('es-CO')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Panel: Guía e Historial */}
        <div className="space-y-8">
          
          {/* Guide Tracking Panel */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-md p-8 space-y-5">
            <h3 className="font-black text-sm uppercase tracking-wider text-text-primary flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/50 pb-3">
              <Truck size={16} className="text-brand" />
              <span>Información de Guía</span>
            </h3>
            
            {order.guide ? (
              <div className="text-sm space-y-4 font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Número de Guía</span>
                    <span className="font-black text-text-primary">{order.guide.number}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Estado Guía</span>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full ${guideStateColor(order.guide.state)}`}>
                      {HOKO_GUIDE_STATES_CO[order.guide.state] || order.guide.state}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Courier</span>
                    <span className="font-black text-text-primary">{(order as any).courier?.name || `ID: ${order.courier_id}`}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Costo Flete</span>
                    <span className="font-black text-text-primary">
                      {order.guide.total_freight_store ? `$${parseInt(order.guide.total_freight_store).toLocaleString('es-CO')}` : '—'}
                    </span>
                  </div>
                </div>

                {(order as any).guide_pdf && (
                  <div className="pt-3">
                    <a
                      href={(order as any).guide_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white text-xs font-black uppercase rounded-xl hover:bg-brand/90 transition-colors shadow-sm"
                    >
                      <FileText size={14} />
                      <span>Imprimir Guía PDF</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted italic font-medium">Esta orden aún no tiene guía generada.</p>
              </div>
            )}
          </div>

          {/* Physical specifications */}
          {order.measures && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-md p-8 space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-text-primary flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <ClipboardList size={16} className="text-brand" />
                <span>Empaque y Dimensiones</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Dimensiones (An×Al×La)</span>
                  <span className="font-black text-text-primary">
                    {order.measures.width}×{order.measures.height}×{order.measures.length} cm
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase tracking-wider font-bold">Peso Físico</span>
                  <span className="font-black text-text-primary">{order.measures.weight} kg</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Edit Order Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="bg-card rounded-[32px] border border-slate-200/50 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh] lg:h-[75vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-brand text-[9px] font-black uppercase tracking-widest">Modificar Detalles</span>
                <h2 className="text-sm font-black text-text-primary uppercase mt-0.5 font-bold">Editar orden Hoko #{order.id}</h2>
              </div>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-hover rounded-xl text-text-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Customer */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <User size={12} className="text-brand" />
                    <span>Datos del destinatario</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Nombre completo</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerName} onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Email</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerEmail} onChange={e => setEditForm(f => ({ ...f, customerEmail: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Teléfono</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerPhone} onChange={e => setEditForm(f => ({ ...f, customerPhone: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Identificación</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerIdentification} onChange={e => setEditForm(f => ({ ...f, customerIdentification: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Ciudad</label>
                      <select className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 appearance-none cursor-pointer"
                        value={editForm.cityId} onChange={e => setEditForm(f => ({ ...f, cityId: e.target.value }))} required>
                        <option value="">Seleccionar...</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Dirección</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerAddress} onChange={e => setEditForm(f => ({ ...f, customerAddress: e.target.value }))} required />
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <Package size={12} className="text-brand" />
                    <span>Contenido y Medidas</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Contenido de la orden</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.contain} onChange={e => setEditForm(f => ({ ...f, contain: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Peso (kg)</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.weight} onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-3 gap-3 col-span-2">
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Ancho (cm)</label>
                        <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                          value={editForm.width} onChange={e => setEditForm(f => ({ ...f, width: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Alto (cm)</label>
                        <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                          value={editForm.height} onChange={e => setEditForm(f => ({ ...f, height: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Largo (cm)</label>
                        <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                          value={editForm.length} onChange={e => setEditForm(f => ({ ...f, length: e.target.value }))} required />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-card flex items-center justify-between shrink-0">
                <Button type="button" variant="ghost" onClick={() => setShowEdit(false)} className="h-11 px-6 rounded-2xl text-xs font-bold transition-all">Cancelar</Button>
                <Button type="submit" variant="primary" disabled={editing} className="h-11 px-8 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  {editing ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
