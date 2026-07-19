"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  User,
  Hash,
  Globe,
  Tag,
  Eye
} from 'lucide-react';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Avatar } from '../shared/Avatar';

export function ContactList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get('id');

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Single Client view details
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [loadingClientDetail, setLoadingClientDetail] = useState(false);

  // Fetch all clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single client detail (with their orders)
  const fetchClientDetail = async (id: string) => {
    setLoadingClientDetail(true);
    try {
      const res = await fetch(`/api/clientes?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSelectedClient(data);
      } else {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
      setSelectedClient(null);
    } finally {
      setLoadingClientDetail(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Listen to URL parameter changes to show client detail immediately
  useEffect(() => {
    if (clientIdFromUrl) {
      fetchClientDetail(clientIdFromUrl);
    } else {
      setSelectedClient(null);
    }
  }, [clientIdFromUrl]);

  const filteredClients = clients.filter(c => 
    String(c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.telefono || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChannelBadge = (canal: string) => {
    switch (canal) {
      case 'pagina_web':
        return <Badge variant="success" className="font-extrabold uppercase bg-brand/10 border-brand/20 text-brand">Shopify</Badge>;
      case 'whatsApp':
        return <Badge variant="info" className="font-extrabold uppercase bg-success/10 border-success/20 text-success">WhatsApp</Badge>;
      default:
        return <Badge variant="default" className="font-extrabold uppercase">{canal || 'Desconocido'}</Badge>;
    }
  };

  if (loadingClientDetail) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-brand" size={32} />
        <p className="text-text-muted font-medium text-sm">Cargando perfil del cliente...</p>
      </div>
    );
  }

  // Single Client Details View
  if (selectedClient) {
    return (
      <div className="space-y-4 w-full px-4 md:px-6 py-2 animate-in fade-in duration-500">
        {/* Back Button */}
        <div>
          <button 
            onClick={() => {
              setSelectedClient(null);
              router.push('/contacts');
            }}
            className="flex items-center gap-2 text-xs font-black uppercase text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver a Clientes</span>
          </button>
        </div>

        {/* Client Header Card */}
        <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
            <Avatar name={selectedClient.nombre || 'Cliente'} size="lg" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-text-primary truncate">
                  {selectedClient.nombre}
                </h1>
                {getChannelBadge(selectedClient.canal)}
              </div>
              <p className="text-text-muted text-xs font-semibold mt-1">
                ID del Cliente: <span className="font-mono">{selectedClient.cliente_id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Client details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left info column */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-4 h-fit">
            <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center gap-2">
              <User size={15} className="text-text-muted" />
              <span>Información General</span>
            </h3>

            <div className="space-y-3.5 text-xs font-medium text-text-secondary">
              {selectedClient.identificacion && (
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Identificación</span>
                  <span className="text-text-primary font-bold">{selectedClient.identificacion}</span>
                </div>
              )}
              <div>
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Teléfono</span>
                <span className="text-text-primary font-bold flex items-center gap-1.5 mt-0.5">
                  <Phone size={12} className="text-text-muted" />
                  {selectedClient.telefono || 'Sin teléfono'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Email</span>
                <span className="text-text-primary font-bold flex items-center gap-1.5 mt-0.5">
                  <Mail size={12} className="text-text-muted" />
                  {selectedClient.email || 'Sin correo electrónico'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Dirección</span>
                <span className="text-text-primary font-bold flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} className="text-text-muted" />
                  {selectedClient.direccion || 'Sin dirección registrada'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Ciudad</span>
                <span className="text-text-primary font-bold">{selectedClient.ciudad || 'Sin ciudad'}</span>
              </div>
            </div>
          </div>

          {/* Right orders list column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={15} className="text-text-muted" />
                  <span>Historial de Pedidos</span>
                </div>
                <span className="bg-brand-bg text-brand text-[10px] px-2 py-0.5 rounded-full font-black">
                  {selectedClient.orders?.length || 0}
                </span>
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/50 mt-2">
                {!selectedClient.orders || selectedClient.orders.length === 0 ? (
                  <p className="p-8 text-center text-xs text-text-muted italic">Este cliente no tiene pedidos registrados.</p>
                ) : (
                  selectedClient.orders.map((order: any) => {
                    const orderDate = new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
                    const isFulfill = order.delivery_state === '4';
                    
                    return (
                      <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-black text-text-primary hover:text-brand transition-colors cursor-pointer" onClick={() => router.push(`/pedidos/${order.id}`)}>
                            {order.shopify_order_name || `Pedido #${order.id}`}
                          </p>
                          <p className="text-[10px] text-text-muted font-medium mt-0.5">
                            {orderDate} | <span className="uppercase font-bold">{order.payment_type || 'Manual'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs font-black text-text-primary">
                              ${(order.total_paid || 0).toLocaleString('es-CO')}
                            </p>
                            <span className={`inline-block text-[9px] font-bold mt-0.5 ${isFulfill ? 'text-success' : 'text-warning'}`}>
                              {isFulfill ? 'Entregado' : 'Pendiente'}
                            </span>
                          </div>
                          <button
                            onClick={() => router.push(`/pedidos/${order.id}`)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-bg transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6 py-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase italic">
            Clientes <span className="text-brand">Hub</span>
          </h1>
          <p className="text-text-muted font-medium text-xs mt-1">Gestiona los clientes registrados en Winners Hub desde Supabase.</p>
        </div>
        <Button 
          variant="outline"
          onClick={fetchClients} 
          disabled={loading}
          className="flex items-center gap-2 border-slate-200/50 dark:border-slate-800"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sincronizar</span>
        </Button>
      </div>

      {/* Search bar */}
      <div className="bg-card p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-ring"
            placeholder="Buscar clientes por nombre, teléfono, email..."
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-brand" size={28} />
            <p className="text-text-muted font-medium text-sm">Cargando lista de clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <User className="text-text-muted/40" size={40} />
            <p className="text-text-muted font-black text-sm uppercase tracking-wider">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Origen</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Identificación</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Teléfono / Email</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Ciudad / Dirección</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredClients.map((client) => (
                  <tr 
                    key={client.cliente_id} 
                    onClick={() => router.push(`/contacts?id=${encodeURIComponent(client.cliente_id)}`)}
                    className="hover:bg-hover transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={client.nombre || 'Cliente'} />
                        <span className="text-xs font-black text-text-primary">{client.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getChannelBadge(client.canal)}
                    </td>
                    <td className="px-4 py-4 text-xs font-mono font-bold text-text-secondary">
                      {client.identificacion || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{client.telefono || '—'}</span>
                        {client.email && <span className="text-[10px] text-text-muted">{client.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{client.ciudad || '—'}</span>
                        {client.direccion && <span className="text-[10px] text-text-muted truncate max-w-[200px]">{client.direccion}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/contacts?id=${encodeURIComponent(client.cliente_id)}`);
                        }}
                        className="p-1 rounded-lg text-text-muted hover:text-brand hover:bg-brand-bg transition-colors"
                      >
                        <Eye size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-[10px] font-bold text-text-muted text-right">
        {filteredClients.length} de {clients.length} clientes
      </div>
    </div>
  );
}
