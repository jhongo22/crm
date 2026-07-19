"use client";

import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, RefreshCw, ChevronRight, Filter, X, Package, Truck, FileSpreadsheet, CreditCard, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { useRouter } from 'next/navigation';

interface OrdersDashboardProps {
  onViewOrderDetail: (id: string) => void;
}

type OrderStatus = 'ACTIVE' | 'CANCELLED' | 'VOIDED' | 'ALL';

export function OrdersDashboard({ onViewOrderDetail }: OrdersDashboardProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
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
    canal: 'ALL',
    gateway: 'ALL',
    minAmount: '',
    maxAmount: '',
    hasGuide: 'ALL',
    city: '',
  });

  const getOrderStatus = (order: any): OrderStatus => {
    if (order.cancelledAt || order.delivery_state === '5') return 'CANCELLED';
    if (order.displayFinancialStatus === 'VOIDED') return 'VOIDED';
    return 'ACTIVE';
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'CANCELLED': return { text: 'Cancelado', class: 'text-danger' };
      case 'VOIDED': return { text: 'Anulado', class: 'text-text-muted' };
      default: return { text: 'Activo', class: 'text-brand' };
    }
  };

  const getFinancialStatus = (order: any): string => {
    if (order.displayFinancialStatus) return order.displayFinancialStatus;
    const payType = String(order.payment_type || '').toLowerCase();
    if (payType.includes('pagado')) return 'PAID';
    return 'PENDING';
  };

  const getFulfillmentStatus = (order: any): string => {
    if (order.displayFulfillmentStatus) return order.displayFulfillmentStatus;
    const state = String(order.delivery_state || '');
    if (state === '4') return 'FULFILLED';
    if (state === '2' || state === '3') return 'PARTIALLY_FULFILLED';
    return 'UNFULFILLED';
  };

  const getDeliveryStatus = (order: any) => {
    if (order.guide) {
      const state = String(order.guide.state);
      switch (state) {
        case '3':
        case '17':
        case '19':
          return { text: 'Entregado', class: 'bg-success-bg text-success' };
        case '6':
        case '18':
        case '21':
          return { text: 'En novedad', class: 'bg-warning-bg text-warning' };
        case '2':
        case '7':
        case '9':
        case '13':
          return { text: 'En tránsito', class: 'bg-info-bg text-info' };
        default:
          return { text: 'Despachado', class: 'bg-info-bg text-info' };
      }
    }
    const fulfillment = getFulfillmentStatus(order);
    if (fulfillment === 'FULFILLED') return { text: 'En tránsito', class: 'bg-info-bg text-info' };
    if (fulfillment === 'PARTIALLY_FULFILLED') return { text: 'En tránsito parcial', class: 'bg-info-bg text-info' };
    return { text: 'Sin enviar', class: 'bg-warning-bg text-warning' };
  };

  const getDeliveryMethod = (order: any): string => {
    if (order.courier_name) return order.courier_name;
    if (order.courier?.name) return order.courier.name;
    return 'Pendiente';
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
      default: return { text: status, class: 'bg-card-alt text-text-secondary' };
    }
  };

  const getDeliveryStatusFilterValue = (order: any) => {
    const delivery = getDeliveryStatus(order);
    if (delivery.text === 'Entregado') return 'DELIVERED';
    if (delivery.text.includes('tránsito') || delivery.text === 'Despachado') return 'TRANSIT';
    return 'UNSHIPPED';
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. Fetch unified database orders
      const resPedidos = await fetch('/api/pedidos', { cache: 'no-store' });
      const dbPedidos = await resPedidos.json();
      
      if (!Array.isArray(dbPedidos)) {
        setConnected(false);
        setLoading(false);
        return;
      }
      
      // 2. Fetch Shopify orders list
      let shopifyOrders: any[] = [];
      try {
        const resShopify = await fetch('/api/shopify', {
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
                        presentmentMoney { amount currencyCode }
                      }
                      lineItems(first: 10) {
                        edges {
                          node { title quantity }
                        }
                      }
                      customer { firstName lastName email phone }
                      shippingAddress { city }
                      paymentGatewayNames
                    }
                  }
                }
              }
            `
          })
        });
        const shopifyData = await resShopify.json();
        if (shopifyData?.data?.orders?.edges) {
          shopifyOrders = shopifyData.data.orders.edges.map((edge: any) => edge.node);
        }
      } catch (e) {
        console.error("Error fetching Shopify orders:", e);
      }
      
      // Create a map of Shopify orders by GID / ID and by Name
      const shopifyMap = new Map<string, any>();
      shopifyOrders.forEach((o: any) => {
        shopifyMap.set(o.id.toLowerCase(), o);
        const numOnly = o.id.split('/').pop()?.toLowerCase();
        if (numOnly) shopifyMap.set(numOnly, o);
        shopifyMap.set(o.name.toLowerCase(), o);
        shopifyMap.set(o.name.replace('#', '').toLowerCase(), o);
      });
      
      // Merge rich Shopify details into the database orders
      const mergedOrders = dbPedidos.map((dbOrder: any) => {
        if (dbOrder.canal === 'pagina_web') {
          let match = null;
          if (dbOrder.shopify_order_id) {
            match = shopifyMap.get(dbOrder.shopify_order_id.toLowerCase());
          }
          if (!match && dbOrder.shopify_order_name) {
            match = shopifyMap.get(dbOrder.shopify_order_name.toLowerCase());
          }
          
          if (match) {
            const clientName = match.customer 
              ? `${match.customer.firstName || ''} ${match.customer.lastName || ''}`.trim() 
              : dbOrder.customer?.name;

            return {
              ...dbOrder,
              ...match,
              db_id: dbOrder.db_id,
              hoko_order_id: dbOrder.hoko_order_id,
              canal: dbOrder.canal,
              shopify_order_name: match.name,
              shopify_order_id: match.id,
              customer: {
                ...dbOrder.customer,
                name: clientName || dbOrder.customer?.name,
                email: match.customer?.email || dbOrder.customer?.email,
                phone: match.customer?.phone || dbOrder.customer?.phone,
              }
            };
          }
        }
        return dbOrder;
      });
      
      setOrders(mergedOrders);
      setConnected(true);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
    const clientName = order.customer?.name || '';
    const matchesSearch =
      String(order.shopify_order_name || '').toLowerCase().includes(q) ||
      clientName.toLowerCase().includes(q) ||
      String(order.customer?.phone || '').toLowerCase().includes(q);

    let orderTotal = order.total_paid || 0;
    if (order.totalPriceSet?.presentmentMoney?.amount) {
      orderTotal = parseFloat(order.totalPriceSet.presentmentMoney.amount);
    }

    const matchesStatus = filters.status === 'ALL' || getOrderStatus(order) === filters.status;
    const matchesPayment = filters.payment === 'ALL' || getFinancialStatus(order) === filters.payment;
    const matchesFulfillment = filters.fulfillment === 'ALL' || getFulfillmentStatus(order) === filters.fulfillment;
    const matchesDelivery = filters.delivery === 'ALL' || getDeliveryStatusFilterValue(order) === filters.delivery;
    const matchesCanal = filters.canal === 'ALL' || order.canal === filters.canal;

    // Additional filters
    const gatewayName = order.paymentGatewayNames?.[0] || order.payment_type || 'Manual';
    const matchesGateway = filters.gateway === 'ALL' || gatewayName.toLowerCase().includes(filters.gateway.toLowerCase());
    
    const matchesMinAmount = !filters.minAmount || orderTotal >= parseFloat(filters.minAmount);
    const matchesMaxAmount = !filters.maxAmount || orderTotal <= parseFloat(filters.maxAmount);

    const matchesGuide = filters.hasGuide === 'ALL' || 
      (filters.hasGuide === 'YES' && !!order.hoko_order_id) || 
      (filters.hasGuide === 'NO' && !order.hoko_order_id);

    const clientCity = order.customer?.city || '';
    const matchesCity = !filters.city || clientCity.toLowerCase().includes(filters.city.toLowerCase());

    const orderDate = new Date(order.created_at);
    const matchesDateFrom = !filters.dateFrom || orderDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || orderDate <= new Date(filters.dateTo + 'T23:59:59');

    return matchesSearch && matchesStatus && matchesPayment && matchesFulfillment && matchesDelivery && matchesCanal && matchesDateFrom && matchesDateTo && matchesGateway && matchesMinAmount && matchesMaxAmount && matchesGuide && matchesCity;
  });

  // KPI Calculations
  const getOrderTotalVal = (order: any): number => {
    if (order.totalPriceSet?.presentmentMoney?.amount) {
      return parseFloat(order.totalPriceSet.presentmentMoney.amount);
    }
    return order.total_paid || 0;
  };

  const totalOrders = filteredOrders.length;
  
  const totalSales = filteredOrders
    .filter(o => getOrderStatus(o) !== 'CANCELLED')
    .reduce((sum, o) => sum + getOrderTotalVal(o), 0);

  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  const salesShopify = filteredOrders
    .filter(o => o.canal === 'pagina_web' && getOrderStatus(o) !== 'CANCELLED')
    .reduce((sum, o) => sum + getOrderTotalVal(o), 0);

  const salesWhatsApp = filteredOrders
    .filter(o => o.canal !== 'pagina_web' && getOrderStatus(o) !== 'CANCELLED')
    .reduce((sum, o) => sum + getOrderTotalVal(o), 0);

  const totalItemsOrdered = filteredOrders.reduce((sum, order) => {
    let itemsCount = 1;
    if (order.lineItems?.edges) {
      itemsCount = order.lineItems.edges.reduce((s: number, e: any) => s + (e.node.quantity || 1), 0);
    } else {
      itemsCount = order.quantity || 1;
    }
    return sum + itemsCount;
  }, 0);

  const unfulfilledOrdersCount = filteredOrders.filter(o => getFulfillmentStatus(o) === 'UNFULFILLED').length;
  const fulfilledOrdersCount = filteredOrders.filter(o => getFulfillmentStatus(o) === 'FULFILLED').length;
  const deliveredCount = filteredOrders.filter(o => getDeliveryStatusFilterValue(o) === 'DELIVERED').length;
  const cancelledOrdersCount = filteredOrders.filter(o => getOrderStatus(o) === 'CANCELLED').length;

  const activeFilterCount = [
    filters.status !== 'ACTIVE', 
    filters.payment !== 'ALL', 
    filters.fulfillment !== 'ALL', 
    filters.delivery !== 'ALL', 
    filters.canal !== 'ALL', 
    filters.gateway !== 'ALL',
    !!filters.minAmount,
    !!filters.maxAmount,
    filters.hasGuide !== 'ALL',
    !!filters.city,
    !!filters.dateFrom, 
    !!filters.dateTo
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 w-full px-4 md:px-6 py-4 animate-in fade-in duration-500">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
              Pedidos <span className="text-brand">Hub</span>
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
            Visualiza y administra los pedidos consolidados de Shopify y Chat con KPIs en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 border-slate-200/50 dark:border-slate-800"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sincronizar</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const headers = [
                'Pedido', 'Fecha', 'Cliente', 'Email', 'Teléfono', 
                'Dirección Envío', 'Ciudad Envío', 'Origen/Canal',
                'Total', 'Estado Pago', 'Estado Prep', 'Estado Entrega', 'Hoko ID'
              ];
              const rows = filteredOrders.map(order => {
                const payment = getFinancialStatusLabel(getFinancialStatus(order));
                const fulfillment = getFulfillmentStatusLabel(getFulfillmentStatus(order));
                const delivery = getDeliveryStatus(order);
                const clientName = order.customer?.name || 'Sin cliente';
                const shippingAddressStr = order.customer?.address || '—';
                const currency = 'COP';

                return {
                  'Pedido': order.shopify_order_name || `#${order.db_id}`,
                  'Fecha': new Date(order.created_at).toLocaleString('es-CO'),
                  'Cliente': clientName,
                  'Email': order.customer?.email || '—',
                  'Teléfono': order.customer?.phone || '—',
                  'Dirección Envío': shippingAddressStr,
                  'Ciudad Envío': order.customer?.city || '—',
                  'Origen/Canal': order.canal === 'pagina_web' ? 'Shopify' : order.canal,
                  'Total': `${getOrderTotalVal(order)} ${currency}`,
                  'Estado Pago': payment.text,
                  'Estado Prep': fulfillment.text,
                  'Estado Entrega': delivery.text,
                  'Hoko ID': order.hoko_order_id || '—'
                };
              });

              const csvRows = [headers.join(';')];
              rows.forEach(r => {
                const vals = headers.map(h => {
                  const val = r[h as keyof typeof r];
                  const valStr = val === undefined || val === null ? '' : String(val);
                  return `"${valStr.replace(/"/g, '""')}"`;
                });
                csvRows.push(vals.join(';'));
              });

              const csvContent = "\uFEFF" + csvRows.join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `pedidos_hub_${new Date().toISOString().slice(0,10)}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            disabled={loading || filteredOrders.length === 0}
            className="bg-[#1D743F] text-white hover:bg-[#155a30] border-0 flex items-center gap-2 h-9 text-[11px] font-bold shadow-sm shadow-emerald-800/10 px-3 rounded-lg"
          >
            <FileSpreadsheet size={14} />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* Extended KPIs Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Facturación Total</p>
            <span className="text-base font-black text-text-primary">${totalSales.toLocaleString('es-CO')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-success/10 text-success rounded-xl">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Ticket Promedio</p>
            <span className="text-base font-black text-text-primary">${averageTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
            <ShoppingCart size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Ventas Shopify</p>
            <span className="text-base font-black text-text-primary">${salesShopify.toLocaleString('es-CO')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-success/10 text-success rounded-xl">
            <Truck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Ventas Chat</p>
            <span className="text-base font-black text-text-primary">${salesWhatsApp.toLocaleString('es-CO')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
            <Package size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pendientes de Envío</p>
            <span className="text-base font-black text-warning">{unfulfilledOrdersCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-danger/10 text-danger rounded-xl">
            <X size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Cancelados / Anulados</p>
            <span className="text-base font-black text-danger">{cancelledOrdersCount}</span>
          </div>
        </div>
      </div>

      {/* Search Bar + Filter Toggle */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-card p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido o teléfono..."
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
            <span>Filtros Avanzados</span>
            {activeFilterCount > 0 && (
              <span className="bg-brand-bg text-brand dark:text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Origen (Canal)</label>
              <select
                value={filters.canal}
                onChange={(e) => setFilters(f => ({ ...f, canal: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="pagina_web">Shopify</option>
                <option value="whatsApp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Método de Pago</label>
              <select
                value={filters.gateway}
                onChange={(e) => setFilters(f => ({ ...f, gateway: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="cash">Contra reembolso (COD)</option>
                <option value="shopify_payments">Shopify Payments</option>
                <option value="manual">Manual / Chat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/50">
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Guía Hoko</label>
              <select
                value={filters.hasGuide}
                onChange={(e) => setFilters(f => ({ ...f, hasGuide: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="YES">Tiene guía</option>
                <option value="NO">Sin guía</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Monto Mínimo</label>
              <input
                type="number"
                placeholder="Ej. 100000"
                value={filters.minAmount}
                onChange={(e) => setFilters(f => ({ ...f, minAmount: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary placeholder:text-text-placeholder"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Monto Máximo</label>
              <input
                type="number"
                placeholder="Ej. 500000"
                value={filters.maxAmount}
                onChange={(e) => setFilters(f => ({ ...f, maxAmount: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary placeholder:text-text-placeholder"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Ciudad Envío</label>
              <input
                type="text"
                placeholder="Ej. Medellín"
                value={filters.city}
                onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary placeholder:text-text-placeholder"
              />
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
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ status: 'ALL', payment: 'ALL', fulfillment: 'ALL', delivery: 'ALL', dateFrom: '', dateTo: '', canal: 'ALL', gateway: 'ALL', minAmount: '', maxAmount: '', hasGuide: 'ALL', city: '' })}
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
            <p className="text-text-muted font-medium text-sm">Obteniendo datos de pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <ShoppingBag className="text-text-muted/40" size={40} />
            <p className="text-text-muted font-black text-sm uppercase tracking-wider">No se encontraron pedidos</p>
            {activeFilterCount > 0 && (
              <button onClick={() => setFilters({ status: 'ALL', payment: 'ALL', fulfillment: 'ALL', delivery: 'ALL', dateFrom: '', dateTo: '', canal: 'ALL', gateway: 'ALL', minAmount: '', maxAmount: '', hasGuide: 'ALL', city: '' })} className="text-brand text-xs font-bold underline">Limpiar filtros</button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Pedido</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Origen</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Pago</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Prep.</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Entrega</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Envío</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Arts.</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredOrders.map((order) => {
                    const payment = getFinancialStatusLabel(getFinancialStatus(order));
                    const fulfillment = getFulfillmentStatusLabel(getFulfillmentStatus(order));
                    const delivery = getDeliveryStatus(order);
                    const deliveryMethod = getDeliveryMethod(order);
                    const orderStatus = getOrderStatus(order);
                    const orderStatusStyle = getOrderStatusLabel(orderStatus);
                    const clientName = order.customer?.name || 'Sin cliente';
                    
                    let itemsCount = order.quantity || 1;
                    if (order.lineItems?.edges) {
                      itemsCount = order.lineItems.edges.reduce((s: number, e: any) => s + (e.node.quantity || 1), 0);
                    }

                    const isCancelledOrVoided = orderStatus === 'CANCELLED' || orderStatus === 'VOIDED';
                    const rowClasses = [
                      'transition-colors cursor-pointer group',
                      isCancelledOrVoided ? 'opacity-60 hover:opacity-80' : 'hover:bg-hover'
                    ].filter(Boolean).join(' ');

                    return (
                      <tr
                        key={order.db_id}
                        onClick={() => onViewOrderDetail(order.db_id.toString())}
                        className={rowClasses}
                      >
                        <td className="px-4 py-4">
                          <span className={`text-xs font-black ${orderStatusStyle.class} ${isCancelledOrVoided ? 'line-through' : ''}`}>
                            {order.shopify_order_name || `#${order.db_id}`}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md border ${order.canal === 'pagina_web' ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-success/10 border-success/20 text-success'}`}>
                            {order.canal === 'pagina_web' ? 'Shopify' : order.canal}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[11px] font-bold text-text-muted whitespace-nowrap">
                          {formatDateShort(order.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-text-primary truncate max-w-[120px]">{clientName}</span>
                            {order.customer?.phone && (
                              <span className="text-[9px] font-medium text-text-muted truncate max-w-[120px]">{order.customer.phone}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-black text-text-primary whitespace-nowrap">
                            ${getOrderTotalVal(order).toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full border ${payment.class}`}>
                            {payment.text}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${fulfillment.class}`}>
                            {fulfillment.text}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${delivery.class}`}>
                            <Truck size={10} />
                            {delivery.text}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                              <Package size={10} className="shrink-0" />
                              {deliveryMethod}
                            </span>
                            {order.hoko_order_id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/ordenes/${order.hoko_order_id}`);
                                }}
                                className="inline-flex items-center gap-1 text-brand text-[9px] font-black hover:underline"
                              >
                                <Truck size={8} />
                                <span>Hoko: #{order.hoko_order_id}</span>
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[11px] font-bold text-text-muted text-center">
                          {itemsCount}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewOrderDetail(order.db_id.toString());
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

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredOrders.map((order) => {
                const payment = getFinancialStatusLabel(getFinancialStatus(order));
                const fulfillment = getFulfillmentStatusLabel(getFulfillmentStatus(order));
                const delivery = getDeliveryStatus(order);
                const orderStatus = getOrderStatus(order);
                const orderStatusStyle = getOrderStatusLabel(orderStatus);
                const clientName = order.customer?.name || 'Sin cliente';
                
                let itemsCount = order.quantity || 1;
                if (order.lineItems?.edges) {
                  itemsCount = order.lineItems.edges.reduce((s: number, e: any) => s + (e.node.quantity || 1), 0);
                }

                const isCancelledOrVoided = orderStatus === 'CANCELLED' || orderStatus === 'VOIDED';

                return (
                  <div
                    key={order.db_id}
                    onClick={() => onViewOrderDetail(order.db_id.toString())}
                    className="p-4 flex flex-col gap-2.5 hover:bg-hover active:bg-hover transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-black ${orderStatusStyle.class} ${isCancelledOrVoided ? 'line-through' : ''}`}>
                        {order.shopify_order_name || `#${order.db_id}`}
                      </span>
                      <span className="text-xs font-black text-text-primary">
                        ${getOrderTotalVal(order).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-text-secondary font-medium">
                      <div>
                        <p className="font-bold text-text-primary">{clientName}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {formatDateShort(order.created_at)} | <span className="uppercase font-bold">{order.canal === 'pagina_web' ? 'Shopify' : order.canal}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p>{itemsCount} art.</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{getDeliveryMethod(order)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full border ${payment.class}`}>
                        {payment.text}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${fulfillment.class}`}>
                        {fulfillment.text}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${delivery.class}`}>
                        <Truck size={10} />
                        {delivery.text}
                      </span>
                      {order.hoko_order_id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/ordenes/${order.hoko_order_id}`);
                          }}
                          className="inline-flex items-center gap-1 bg-brand/20 text-brand px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full hover:bg-brand/30"
                        >
                          <Truck size={10} />
                          <span>Hoko: #{order.hoko_order_id}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Results count */}
      <div className="text-[10px] font-bold text-text-muted text-right">
        {filteredOrders.length} de {orders.length} pedidos
      </div>

    </div>
  );
}
