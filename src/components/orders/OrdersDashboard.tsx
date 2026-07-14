"use client";

import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, RefreshCw, ChevronRight, Filter, X, Tag, Package, Truck, Hash } from 'lucide-react';
import { ShopifyOrder } from '../../types';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';

interface OrdersDashboardProps {
  onViewOrderDetail: (id: string) => void;
}

type OrderStatus = 'ACTIVE' | 'CANCELLED' | 'VOIDED' | 'ARCHIVED';

export function OrdersDashboard({ onViewOrderDetail }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: 'ACTIVE' as OrderStatus | 'ALL',
    payment: 'ALL',
    fulfillment: 'ALL',
    delivery: 'ALL',
    dateFrom: '',
    dateTo: '',
    tagQuery: '',
  });

  const getOrderStatus = (order: ShopifyOrder): OrderStatus => {
    if (order.cancelledAt) return 'CANCELLED';
    if (order.displayFinancialStatus === 'VOIDED') return 'VOIDED';
    return 'ACTIVE';
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'CANCELLED': return { text: 'Cancelado', class: 'text-danger' };
      case 'VOIDED': return { text: 'Anulado', class: 'text-text-muted' };
      case 'ARCHIVED': return { text: 'Archivado', class: 'text-text-muted' };
      default: return { text: 'Activo', class: 'text-brand' };
    }
  };

  const getDeliveryStatus = (order: ShopifyOrder) => {
    const fOrders = order.fulfillmentOrders?.edges || [];
    const fOrder = fOrders[0]?.node;
    if (!fOrder) {
      if (order.displayFulfillmentStatus === 'FULFILLED') return { text: 'En tránsito', class: 'bg-info-bg text-info' };
      if (order.displayFulfillmentStatus === 'PARTIALLY_FULFILLED') return { text: 'En tránsito parcial', class: 'bg-info-bg text-info' };
      return { text: 'Sin enviar', class: 'bg-warning-bg text-warning' };
    }
    switch (fOrder.status) {
      case 'IN_TRANSIT': return { text: 'En tránsito', class: 'bg-info-bg text-info' };
      case 'OUT_FOR_DELIVERY': return { text: 'En reparto', class: 'bg-info-bg text-info' };
      case 'DELIVERED': return { text: 'Entregado', class: 'bg-success-bg text-success' };
      case 'ATTEMPTED_DELIVERY': return { text: 'Intento fallido', class: 'bg-danger-bg text-danger' };
      case 'CANCELLED': return { text: 'Cancelado', class: 'bg-card-alt text-text-muted' };
      default: return { text: 'Pendiente', class: 'bg-warning-bg text-warning' };
    }
  };

  const getDeliveryMethod = (order: ShopifyOrder): string => {
    const fOrders = order.fulfillmentOrders?.edges || [];
    const method = fOrders[0]?.node?.deliveryMethod?.methodType;
    if (method) return method;
    const shippingLine = order.shippingLines?.edges?.[0]?.node?.title;
    if (shippingLine) return shippingLine;
    if (order.displayFulfillmentStatus === 'UNFULFILLED') return 'Pendiente';
    return 'Estándar';
  };

  const getFinancialStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: 'Pago pendiente', class: 'bg-warning-bg text-warning border-warning/30' };
      case 'PAID': return { text: 'Pagado', class: 'bg-success-bg text-success border-success/30' };
      case 'AUTHORIZED': return { text: 'Autorizado', class: 'bg-info-bg text-info border-info/20' };
      case 'PARTIALLY_REFUNDED': return { text: 'Parcialmente reembolsado', class: 'bg-info-bg text-info border-info/20' };
      case 'REFUNDED': return { text: 'Reembolsado', class: 'bg-danger-bg text-danger border-danger/20' };
      case 'VOIDED': return { text: 'Anulado', class: 'bg-card-alt text-text-muted border-slate-200/50 dark:border-slate-800' };
      default: return { text: status, class: 'bg-card-alt text-text-secondary border-slate-200/50 dark:border-slate-800' };
    }
  };

  const getFulfillmentStatusLabel = (status: string) => {
    switch (status) {
      case 'UNFULFILLED': return { text: 'No preparado', class: 'bg-warning-bg text-warning' };
      case 'FULFILLED': return { text: 'Preparado', class: 'bg-success-bg text-success' };
      case 'PARTIALLY_FULFILLED': return { text: 'Parcial', class: 'bg-info-bg text-info' };
      case 'RESTOCKED': return { text: 'Reabastecido', class: 'bg-card-alt text-text-muted' };
      case 'FULFILLED_AND_RESTOCKED': return { text: 'Completado', class: 'bg-card-alt text-text-muted' };
      default: return { text: status, class: 'bg-card-alt text-text-secondary' };
    }
  };

  const getDeliveryStatusFilterValue = (order: ShopifyOrder) => {
    const fOrders = order.fulfillmentOrders?.edges || [];
    const fOrder = fOrders[0]?.node;
    if (!fOrder) {
      if (order.displayFulfillmentStatus === 'FULFILLED' || order.displayFulfillmentStatus === 'PARTIALLY_FULFILLED') return 'TRANSIT';
      return 'UNSHIPPED';
    }
    if (fOrder.status === 'DELIVERED') return 'DELIVERED';
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(fOrder.status)) return 'TRANSIT';
    return 'PENDING';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query getOrders {
              orders(first: 50, sortKey: CREATED_AT, reverse: true) {
                edges {
                  node {
                    id
                    name
                    createdAt
                    cancelledAt
                    displayFinancialStatus
                    displayFulfillmentStatus
                    tags
                    totalPriceSet {
                      presentmentMoney {
                        amount
                        currencyCode
                      }
                    }
                    lineItems(first: 10) {
                      edges {
                        node {
                          title
                          quantity
                        }
                      }
                    }
                    customer {
                      firstName
                      lastName
                      email
                    }
                    channelInformation {
                      channelDefinition {
                        channelName
                      }
                    }
                    shippingLines(first: 5) {
                      edges {
                        node {
                          title
                          code
                        }
                      }
                    }
                    fulfillments(first: 5) {
                      id
                      status
                      trackingInfo {
                        number
                        url
                        company
                      }
                    }
                    fulfillmentOrders(first: 5) {
                      edges {
                        node {
                          id
                          status
                          deliveryMethod {
                            methodType
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `
        })
      });
      const data = await response.json();
      if (data?.data?.orders?.edges) {
        const mappedOrders = data.data.orders.edges.map((edge: any) => edge.node);
        setOrders(mappedOrders);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch (error) {
      console.error('Error fetching Shopify orders:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.name.toLowerCase().includes(q) ||
      (order.customer && `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(q)) ||
      (order.tags && (Array.isArray(order.tags) ? order.tags : [order.tags]).some(t => t.toLowerCase().includes(q)));

    const matchesStatus = filters.status === 'ALL' || getOrderStatus(order) === filters.status;
    const matchesPayment = filters.payment === 'ALL' || order.displayFinancialStatus === filters.payment;
    const matchesFulfillment = filters.fulfillment === 'ALL' || order.displayFulfillmentStatus === filters.fulfillment;
    const matchesDelivery = filters.delivery === 'ALL' || getDeliveryStatusFilterValue(order) === filters.delivery;

    const orderDate = new Date(order.createdAt);
    const matchesDateFrom = !filters.dateFrom || orderDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || orderDate <= new Date(filters.dateTo + 'T23:59:59');

    const matchesTag = !filters.tagQuery ||
      (order.tags && (Array.isArray(order.tags) ? order.tags : [order.tags]).some(t => t.toLowerCase().includes(filters.tagQuery.toLowerCase())));

    return matchesSearch && matchesStatus && matchesPayment && matchesFulfillment && matchesDelivery && matchesDateFrom && matchesDateTo && matchesTag;
  });

  const totalOrders = orders.length;
  const totalItemsOrdered = orders.reduce((sum, order) => {
    return sum + order.lineItems.edges.reduce((itemsSum, edge) => itemsSum + edge.node.quantity, 0);
  }, 0);
  const unfulfilledOrdersCount = orders.filter(o => o.displayFulfillmentStatus === 'UNFULFILLED').length;
  const fulfilledOrdersCount = orders.filter(o => o.displayFulfillmentStatus === 'FULFILLED').length;
  const deliveredCount = orders.filter(o => getDeliveryStatusFilterValue(o) === 'DELIVERED').length;

  const activeFilterCount = [filters.status !== 'ACTIVE', filters.payment !== 'ALL', filters.fulfillment !== 'ALL', filters.delivery !== 'ALL', !!filters.dateFrom, !!filters.dateTo, !!filters.tagQuery].filter(Boolean).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 md:px-6 py-4 animate-in fade-in duration-500">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
              Pedidos <span className="text-brand">Shopify</span>
            </h1>
            {connected ? (
              <Badge variant="success" className="font-bold border-success/20">
                Conectado
              </Badge>
            ) : (
              <Badge variant="danger" className="font-bold">
                Desconectado
              </Badge>
            )}
          </div>
          <p className="text-text-muted font-medium text-xs mt-1">
            Visualiza y administra los pedidos reales de tu tienda Shopify.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 border-slate-200/50 dark:border-slate-800"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sincronizar</span>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pedidos</p>
          <span className="text-lg font-black text-text-primary">{totalOrders}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Artículos</p>
          <span className="text-lg font-black text-text-primary">{totalItemsOrdered}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pendientes</p>
          <span className="text-lg font-black text-warning">{unfulfilledOrdersCount}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Preparados</p>
          <span className="text-lg font-black text-success">{fulfilledOrdersCount}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Entregados</p>
          <span className="text-lg font-black text-success">{deliveredCount}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Devoluciones</p>
          <span className="text-lg font-black text-danger">$0</span>
        </div>
      </div>

      {/* Search Bar + Filter Toggle */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-card p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido o etiqueta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${showFilters ? 'bg-brand text-white border-brand' : 'border-slate-200/50 dark:border-slate-800 text-text-muted hover:text-text-primary'}`}
          >
            <Filter size={14} />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="bg-brand-bg text-brand dark:text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as any }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ACTIVE">Activos</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="VOIDED">Anulados</option>
                <option value="ALL">Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Pago</label>
              <select
                value={filters.payment}
                onChange={(e) => setFilters(f => ({ ...f, payment: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="PAID">Pagado</option>
                <option value="PENDING">Pendiente</option>
                <option value="REFUNDED">Reembolsado</option>
                <option value="AUTHORIZED">Autorizado</option>
                <option value="VOIDED">Anulado</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Preparación</label>
              <select
                value={filters.fulfillment}
                onChange={(e) => setFilters(f => ({ ...f, fulfillment: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="UNFULFILLED">No preparado</option>
                <option value="FULFILLED">Preparado</option>
                <option value="PARTIALLY_FULFILLED">Parcial</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Entrega</label>
              <select
                value={filters.delivery}
                onChange={(e) => setFilters(f => ({ ...f, delivery: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="UNSHIPPED">Sin enviar</option>
                <option value="TRANSIT">En tránsito</option>
                <option value="DELIVERED">Entregado</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Etiqueta</label>
              <input
                type="text"
                placeholder="Buscar etiqueta..."
                value={filters.tagQuery}
                onChange={(e) => setFilters(f => ({ ...f, tagQuery: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary placeholder:text-text-placeholder"
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ status: 'ACTIVE', payment: 'ALL', fulfillment: 'ALL', delivery: 'ALL', dateFrom: '', dateTo: '', tagQuery: '' })}
              className="flex items-center gap-1 text-[10px] font-black text-text-muted hover:text-danger uppercase tracking-wider transition-colors"
            >
              <X size={12} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      )}

      {/* Orders Table Container */}
      <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-brand" size={28} />
            <p className="text-text-muted font-medium text-sm">Obteniendo datos de Shopify...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <ShoppingBag className="text-text-muted/40" size={40} />
            <p className="text-text-muted font-black text-sm uppercase tracking-wider">No se encontraron pedidos</p>
            {activeFilterCount > 0 && (
              <button onClick={() => setFilters({ status: 'ACTIVE', payment: 'ALL', fulfillment: 'ALL', delivery: 'ALL', dateFrom: '', dateTo: '', tagQuery: '' })} className="text-brand text-xs font-bold underline">Limpiar filtros</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Pedido</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Canal</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Pago</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Prep.</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Entrega</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Envío</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Arts.</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Etiquetas</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredOrders.map((order) => {
                  const payment = getFinancialStatusLabel(order.displayFinancialStatus);
                  const fulfillment = getFulfillmentStatusLabel(order.displayFulfillmentStatus);
                  const delivery = getDeliveryStatus(order);
                  const deliveryMethod = getDeliveryMethod(order);
                  const orderStatus = getOrderStatus(order);
                  const orderStatusStyle = getOrderStatusLabel(orderStatus);
                  const clientName = order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName}`
                    : 'Sin cliente';
                  const itemsCount = order.lineItems.edges.reduce((sum, item) => sum + item.node.quantity, 0);
                  const tags: string[] = Array.isArray(order.tags)
                    ? order.tags
                    : order.tags
                      ? order.tags.split(',').map(t => t.trim()).filter(Boolean)
                      : [];

                  const isCancelledOrVoided = orderStatus === 'CANCELLED' || orderStatus === 'VOIDED';
                  const isArchived = orderStatus === 'ARCHIVED';
                  const rowClasses = [
                    'transition-colors cursor-pointer group',
                    isCancelledOrVoided ? 'opacity-60 hover:opacity-80' : '',
                    isArchived ? 'opacity-40 hover:opacity-60' : '',
                    !isCancelledOrVoided && !isArchived ? 'hover:bg-hover' : ''
                  ].filter(Boolean).join(' ');

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onViewOrderDetail(order.id)}
                      className={rowClasses}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black ${orderStatusStyle.class} ${isCancelledOrVoided ? 'line-through' : ''}`}>{order.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-bold text-text-muted whitespace-nowrap">
                        {formatDateShort(order.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-text-primary truncate max-w-[120px]">{clientName}</span>
                          {order.customer?.email && (
                            <span className="text-[9px] font-medium text-text-muted truncate max-w-[120px]">{order.customer.email}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-bold text-text-muted whitespace-nowrap">
                        {order.channelInformation?.channelDefinition?.channelName || 'Online'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-black text-text-primary whitespace-nowrap">
                          ${parseFloat(order.totalPriceSet.presentmentMoney.amount).toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full border ${payment.class}`}>
                          {payment.text}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${fulfillment.class}`}>
                          {fulfillment.text}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${delivery.class}`}>
                          <Truck size={10} />
                          {delivery.text}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                          <Package size={10} className="shrink-0" />
                          {deliveryMethod}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-bold text-text-muted text-center">
                        {itemsCount}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {tags.length > 0 ? tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-bg text-brand text-[8px] font-black uppercase rounded-md">
                              <Tag size={8} />
                              {tag}
                            </span>
                          )) : (
                            <span className="text-[9px] text-text-placeholder italic">—</span>
                          )}
                          {tags.length > 2 && (
                            <span className="text-[8px] font-black text-text-muted">+{tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOrderDetail(order.id);
                          }}
                          className="p-1 rounded-lg text-text-muted hover:text-brand hover:bg-brand-bg transition-all"
                        >
                          <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-[10px] font-bold text-text-muted text-right">
        {filteredOrders.length} de {orders.length} pedidos
      </div>

    </div>
  );
}
