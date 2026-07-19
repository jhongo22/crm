"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, ShoppingBag, MapPin, User, Mail, Phone, Calendar, Clipboard, CreditCard, Box, Tag, Clock, RotateCcw, Receipt, Globe, Hash } from 'lucide-react';
import { Button } from '../shared/Button';

import { useRouter } from 'next/navigation';

interface OrderDetailViewProps {
  orderId: string | null;
  onBack: () => void;
}

export function OrderDetailView({ orderId, onBack }: OrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [paying, setPaying] = useState(false);
  
  // Note states (Shopify only)
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Customer states (Shopify only)
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Tags states (Shopify only)
  const [editingTags, setEditingTags] = useState(false);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);

  // Address states (Shopify only)
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ firstName: '', lastName: '', company: '', address1: '', address2: '', city: '', province: '', zip: '', country: '', phone: '' });
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch from our local pedidos API
      const localRes = await fetch(`/api/pedidos?id=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      const localOrder = await localRes.json();
      
      if (!localOrder) {
        setErrorMessage(`No se pudo encontrar el pedido con ID "${orderId}" en la base de datos.`);
        setLoading(false);
        return;
      }
      
      const isShopify = localOrder.canal === 'pagina_web';
      
      if (isShopify && localOrder.shopify_order_id) {
        // Fetch additional details from Shopify API
        try {
          const response = await fetch('/api/shopify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query getOrderDetails($id: ID!) {
                  order(id: $id) {
                    id
                    name
                    createdAt
                    cancelledAt
                    displayFinancialStatus
                    displayFulfillmentStatus
                    tags
                    note
                    totalPriceSet {
                      presentmentMoney { amount currencyCode }
                    }
                    subtotalPriceSet {
                      presentmentMoney { amount currencyCode }
                    }
                    totalShippingPriceSet {
                      presentmentMoney { amount currencyCode }
                    }
                    totalTaxSet {
                      presentmentMoney { amount currencyCode }
                    }
                    customer {
                      id firstName lastName email phone numberOfOrders
                    }
                    shippingAddress {
                      firstName lastName company address1 address2 city province zip country phone
                    }
                    lineItems(first: 50) {
                      edges {
                        node {
                          id title quantity sku
                          originalUnitPriceSet { presentmentMoney { amount currencyCode } }
                          image { url }
                        }
                      }
                    }
                    fulfillmentOrders(first: 5) {
                      edges { node { id status } }
                    }
                    paymentGatewayNames
                    discountCodes
                    billingAddressMatchesShippingAddress
                    billingAddress { firstName lastName address1 address2 city province zip country phone }
                    fullyPaid
                    cancelReason
                    confirmationNumber
                    sourceName
                    email
                    phone
                    poNumber
                    clientIp
                    shippingLine { title }
                  }
                }
              `,
              variables: { id: localOrder.shopify_order_id }
            })
          });
          const shopifyRes = await response.json();
          if (shopifyRes?.data?.order) {
            // Merge Shopify details with Hoko details
            const merged = {
              ...shopifyRes.data.order,
              ...localOrder,
              id: shopifyRes.data.order.id, // keep GID for shopify actions
              shopify_order_id: localOrder.shopify_order_id,
              db_id: localOrder.db_id,
              cliente_id: localOrder.cliente_id,
              canal: localOrder.canal,
            };
            setOrder(merged);
            setLoading(false);
            return;
          }
        } catch (shopifyError) {
          console.error("Error fetching from Shopify, falling back to local data:", shopifyError);
        }
      }
      
      // Fallback or Chat order (no Shopify)
      // Construct a compatible order object from db/Hoko data
      const mockLineItems = {
        edges: [
          {
            node: {
              id: 'mock-item-1',
              title: localOrder.contain || 'Producto de Chat',
              quantity: localOrder.quantity || 1,
              sku: 'STOCK-' + (localOrder.stock_id || ''),
              originalUnitPriceSet: {
                presentmentMoney: {
                  amount: String((localOrder.total_paid || 199000) / (localOrder.quantity || 1)),
                  currencyCode: 'COP',
                }
              },
              image: { 
                url: (localOrder.stock_id === 55134 || localOrder.stock_id === 55973 || String(localOrder.stock_id) === '55134' || String(localOrder.stock_id) === '55973') 
                  ? '/nanotrack.png' 
                  : null 
              }
            }
          }
        ]
      };
      
      const compatibleOrder: any = {
        id: localOrder.id || `db-${localOrder.db_id}`,
        db_id: localOrder.db_id,
        cliente_id: localOrder.cliente_id,
        canal: localOrder.canal,
        name: localOrder.shopify_order_name || `Pedido #${localOrder.db_id}`,
        createdAt: localOrder.created_at,
        displayFinancialStatus: localOrder.displayFinancialStatus || (String(localOrder.payment_type || '').toLowerCase().includes('pagado') ? 'PAID' : 'PENDING'),
        displayFulfillmentStatus: localOrder.displayFulfillmentStatus || (localOrder.delivery_state === '4' ? 'FULFILLED' : (localOrder.delivery_state === '2' || localOrder.delivery_state === '3' ? 'PARTIALLY_FULFILLED' : 'UNFULFILLED')),
        tags: localOrder.tags || [],
        note: localOrder.note || 'Pedido de Chat',
        totalPriceSet: {
          presentmentMoney: {
            amount: String(localOrder.total_paid || 0),
            currencyCode: 'COP'
          }
        },
        subtotalPriceSet: {
          presentmentMoney: {
            amount: String(localOrder.total_paid || 0),
            currencyCode: 'COP'
          }
        },
        totalShippingPriceSet: {
          presentmentMoney: {
            amount: '0',
            currencyCode: 'COP'
          }
        },
        customer: {
          id: localOrder.customer?.phone || 'chat-client',
          firstName: localOrder.customer?.name || 'Cliente de Chat',
          lastName: '',
          email: localOrder.customer?.email || '',
          phone: localOrder.customer?.phone || '',
          numberOfOrders: 1
        },
        shippingAddress: {
          firstName: localOrder.customer?.name || 'Cliente',
          lastName: '',
          company: '',
          address1: localOrder.customer?.address || '',
          address2: '',
          city: localOrder.customer?.city || '',
          province: '',
          zip: '',
          country: 'Colombia',
          phone: localOrder.customer?.phone || ''
        },
        lineItems: mockLineItems,
        fulfillmentOrders: {
          edges: localOrder.hoko_order_id ? [{ node: { id: String(localOrder.hoko_order_id), status: 'OPEN' } }] : []
        },
        paymentGatewayNames: [localOrder.payment_type || 'Manual'],
        fullyPaid: String(localOrder.payment_type || '').toLowerCase().includes('pagado'),
        sourceName: localOrder.canal || 'whatsApp'
      };
      
      setOrder(compatibleOrder);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleFulfill = async () => {
    if (!order || fulfilling) return;
    const fulfillmentOrderId = order.fulfillmentOrders?.edges?.[0]?.node?.id;
    if (!fulfillmentOrderId) {
      alert("No se encontró una orden de preparación (FulfillmentOrder) válida.");
      return;
    }

    setFulfilling(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation fulfillmentCreate($fulfillment: FulfillmentInput!) {
              fulfillmentCreate(fulfillment: $fulfillment) {
                fulfillment { id status }
                userErrors { field message }
              }
            }
          `,
          variables: {
            fulfillment: {
              lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: fulfillmentOrderId }],
              notifyCustomer: false
            }
          }
        })
      });
      
      const resData = await response.json();
      const errors = resData?.data?.fulfillmentCreate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error de Shopify: ${errors[0].message}`);
      } else {
        alert("¡Pedido marcado como PREPARADO con éxito!");
        fetchOrderDetails();
      }
    } catch (error) {
      console.error("Error fulfilling order:", error);
      alert("Error de conexión al marcar el pedido como preparado.");
    } finally {
      setFulfilling(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!order || paying) return;
    setPaying(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderMarkAsPaid($id: ID!) {
              orderMarkAsPaid(input: { id: $id }) {
                order { id displayFinancialStatus }
                userErrors { field message }
              }
            }
          `,
          variables: { id: order.id }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderMarkAsPaid?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error de Shopify: ${errors[0].message}`);
      } else {
        alert("¡Pedido marcado como PAGADO con éxito!");
        fetchOrderDetails();
      }
    } catch (error) {
      console.error("Error marking order as paid:", error);
    } finally {
      setPaying(false);
    }
  };

  const handleSaveNote = async () => {
    if (!order || savingNote) return;
    setSavingNote(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                order { id note }
                userErrors { field message }
              }
            }
          `,
          variables: { input: { id: order.id, note: noteText } }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingNote(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexión al guardar la nota.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!order?.customer || savingCustomer) return;
    setSavingCustomer(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation customerUpdate($input: CustomerInput!) {
              customerUpdate(input: $input) {
                customer { id firstName lastName email phone }
                userErrors { field message }
              }
            }
          `,
          variables: {
            input: {
              id: order.customer.id,
              firstName: customerForm.firstName,
              lastName: customerForm.lastName,
              email: customerForm.email,
              phone: customerForm.phone || null
            }
          }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.customerUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingCustomer(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexión al actualizar el cliente.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSaveTags = async () => {
    if (!order || savingTags) return;
    setSavingTags(true);
    try {
      const tagsString = tagsList.map(t => t.trim()).filter(Boolean).join(', ');
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                order { id tags }
                userErrors { field message }
              }
            }
          `,
          variables: { input: { id: order.id, tags: tagsString } }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingTags(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexión al guardar etiquetas.');
    } finally {
      setSavingTags(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!order || savingAddress) return;
    setSavingAddress(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                order { id }
                userErrors { field message }
              }
            }
          `,
          variables: {
            input: {
              id: order.id,
              shippingAddress: {
                firstName: addressForm.firstName,
                lastName: addressForm.lastName,
                company: addressForm.company || null,
                address1: addressForm.address1,
                address2: addressForm.address2 || null,
                city: addressForm.city,
                province: addressForm.province || null,
                zip: addressForm.zip || null,
                country: addressForm.country,
                phone: addressForm.phone || null
              }
            }
          }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingAddress(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexión al actualizar la dirección.');
    } finally {
      setSavingAddress(false);
    }
  };

  const getFinancialStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: 'Pago pendiente', class: 'bg-warning-bg text-warning border-warning/30' };
      case 'PAID': return { text: 'Pagado', class: 'bg-success-bg text-success border-success/30' };
      case 'REFUNDED': return { text: 'Reembolsado', class: 'bg-danger-bg text-danger border-danger/20' };
      case 'VOIDED': return { text: 'Anulado', class: 'bg-card-alt text-text-muted border-slate-200/50 dark:border-slate-800' };
      default: return { text: status, class: 'bg-card-alt text-text-secondary border-slate-200/50 dark:border-slate-800' };
    }
  };

  const getFulfillmentStatusLabel = (status: string) => {
    switch (status) {
      case 'UNFULFILLED': return { text: 'No preparado', class: 'bg-warning-bg text-warning' };
      case 'FULFILLED': return { text: 'Preparado', class: 'bg-success-bg text-success' };
      case 'PARTIALLY_FULFILLED': return { text: 'Parcialmente preparado', class: 'bg-info-bg text-info' };
      default: return { text: status, class: 'bg-card-alt text-text-muted' };
    }
  };

  const formatPrice = (amountStr?: string) => {
    if (!amountStr) return '$0';
    return '$' + parseFloat(amountStr).toLocaleString('es-CO');
  };

  const translateGatewayName = (name: string): string => {
    const map: Record<string, string> = {
      'Cash on Delivery (COD)': 'Contra reembolso',
      'cash_on_delivery': 'Contra reembolso',
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'paypal': 'PayPal',
      'nequi': 'Nequi',
      'bancolombia': 'Bancolombia',
      'pse': 'PSE',
    };
    return map[name] || name;
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-brand" size={32} />
        <p className="text-text-muted font-medium text-sm">Cargando detalles del pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <p className="text-danger font-black">Error al cargar pedido</p>
        <p className="text-text-muted text-xs">{errorMessage || 'No se pudo cargar la información del pedido.'}</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={fetchOrderDetails} variant="outline">Reintentar</Button>
          <Button onClick={onBack}>Volver a Pedidos</Button>
        </div>
      </div>
    );
  }

  const isShopify = order.canal === 'pagina_web';
  const payment = getFinancialStatusLabel(order.displayFinancialStatus);
  const fulfillment = getFulfillmentStatusLabel(order.displayFulfillmentStatus);
  const totalItems = order.lineItems?.edges?.reduce((sum: number, edge: any) => sum + (edge.node.quantity || 1), 0) || 1;

  return (
    <div className="space-y-3 w-full px-4 md:px-6 py-2 animate-in fade-in duration-500">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Volver a Pedidos</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-text-primary">
              {order.name}
            </h1>
            <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full border ${payment.class}`}>
              {payment.text}
            </span>
            <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full ${fulfillment.class}`}>
              {fulfillment.text}
            </span>
            <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-md border ${isShopify ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-success/10 border-success/20 text-success'}`}>
              {isShopify ? 'Shopify' : order.canal}
            </span>
          </div>
          <p className="text-text-muted text-xs font-medium mt-1.5 flex items-center gap-1.5">
            <Calendar size={13} />
            <span>{new Date(order.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}</span>
            {order.confirmationNumber && (
              <span className="ml-2 flex items-center gap-1">
                <Hash size={11} />
                <span className="font-bold">{order.confirmationNumber}</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isShopify && order.displayFulfillmentStatus === 'UNFULFILLED' && (
            <Button 
              variant="primary" 
              onClick={handleFulfill} 
              disabled={fulfilling}
              className="h-10 text-xs font-black uppercase tracking-wider"
            >
              {fulfilling ? 'Preparando...' : 'Solicitar preparación'}
            </Button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Fulfillment Box */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand/5 to-transparent px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-bg text-brand flex items-center justify-center">
                    <Box size={16} />
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-wider text-text-primary">
                      {fulfillment.text}
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted mt-0.5">
                      {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                    </p>
                  </div>
                </div>
                {order.hoko_order_id && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg rounded-xl border border-brand/15">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                      <span className="text-[10px] font-black text-brand uppercase tracking-wider">Hoko: #{order.hoko_order_id}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="px-6 py-3 space-y-1">
              {order.lineItems?.edges?.map((edge: any) => {
                const item = edge.node;
                return (
                  <div key={item.id} className="group rounded-2xl bg-card-alt/50 hover:bg-card-alt transition-colors px-4 py-3 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-card border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {item.image?.url ? (
                        <img src={item.image.url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <img src="/nanotrack.png" alt={item.title} className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-[13px] font-bold text-text-primary leading-tight">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-text-muted bg-card px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          SKU: {item.sku || 'N/A'}
                        </span>
                        <span className="text-[10px] font-bold text-text-muted">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-text-primary">
                        {formatPrice(item.originalUnitPriceSet?.presentmentMoney?.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Actions */}
            {isShopify && (
              <div className="px-6 py-4 bg-gradient-to-r from-brand/5 to-transparent border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {order.displayFinancialStatus === 'PENDING' && (
                    <Button 
                      variant="outline" 
                      onClick={handleMarkAsPaid} 
                      disabled={paying}
                      className="h-9 text-[11px] font-black uppercase tracking-wider px-4"
                    >
                      {paying ? 'Procesando...' : 'Marcar como pagado'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center gap-2">
              <CreditCard size={15} className="text-text-muted" />
              <span>Detalles Financieros</span>
            </h3>

            <div className="space-y-2 text-xs font-medium text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})</span>
                <span className="text-text-primary font-bold">{formatPrice(order.subtotalPriceSet?.presentmentMoney?.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-text-primary font-bold">{formatPrice(order.totalShippingPriceSet?.presentmentMoney?.amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3 text-sm font-black text-text-primary">
                <span>Total</span>
                <span>{formatPrice(order.totalPriceSet?.presentmentMoney?.amount)}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-3 space-y-2 text-xs font-medium text-text-secondary">
              {order.paymentGatewayNames && order.paymentGatewayNames.length > 0 && (
                <div className="flex justify-between">
                  <span>Pasarela de pago</span>
                  <span className="text-text-primary font-bold text-right">{order.paymentGatewayNames.map(translateGatewayName).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Notes Box (Shopify only) */}
          {isShopify && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center justify-between">
                <span>Notas del pedido</span>
                <Clipboard size={14} className="text-text-muted" />
              </h3>
              {editingNote ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl p-3 resize-none focus:outline-none focus:border-brand"
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Agregar nota..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setEditingNote(false)} className="h-8 text-[10px]">Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveNote} disabled={savingNote} className="h-8 text-[10px]">
                      {savingNote ? 'Guardando...' : 'Guardar nota'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-text-muted font-medium italic flex-1">
                    {order.note || 'No hay notas.'}
                  </p>
                  <button
                    onClick={() => { setNoteText(order.note || ''); setEditingNote(true); }}
                    className="shrink-0 text-[10px] font-black text-brand hover:text-brand/80 uppercase tracking-wider"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Shipping Address Box */}
          {order.shippingAddress && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-text-muted" />
                  <span>Dirección de envío</span>
                </div>
                {isShopify && !editingAddress && (
                  <button
                    onClick={() => {
                      setAddressForm({
                        firstName: order.shippingAddress?.firstName || '',
                        lastName: order.shippingAddress?.lastName || '',
                        company: order.shippingAddress?.company || '',
                        address1: order.shippingAddress?.address1 || '',
                        address2: order.shippingAddress?.address2 || '',
                        city: order.shippingAddress?.city || '',
                        province: order.shippingAddress?.province || '',
                        zip: order.shippingAddress?.zip || '',
                        country: order.shippingAddress?.country || '',
                        phone: order.shippingAddress?.phone || ''
                      });
                      setEditingAddress(true);
                    }}
                    className="text-[10px] font-black text-brand hover:text-brand/80 uppercase tracking-wider"
                  >
                    Editar
                  </button>
                )}
              </h3>

              {isShopify && editingAddress ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Nombre</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={addressForm.firstName}
                        onChange={(e) => setAddressForm(f => ({ ...f, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Apellido</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={addressForm.lastName}
                        onChange={(e) => setAddressForm(f => ({ ...f, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Dirección</label>
                    <input
                      className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={addressForm.address1}
                      onChange={(e) => setAddressForm(f => ({ ...f, address1: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Ciudad</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Teléfono</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="ghost" onClick={() => setEditingAddress(false)} className="h-8 text-[10px]">Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveAddress} disabled={savingAddress} className="h-8 text-[10px]">
                      {savingAddress ? 'Guardando...' : 'Guardar dirección'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-text-secondary space-y-1 font-medium">
                  <p className="font-black text-text-primary">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.address1}</p>
                  <p>{order.shippingAddress.city}</p>
                  {order.shippingAddress.phone && (
                    <p className="pt-2 flex items-center gap-1.5">
                      <Phone size={11} className="text-text-muted" />
                      <span>{order.shippingAddress.phone}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Profile Box */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center justify-between">
              <span>Cliente</span>
              {isShopify && order.customer && !editingCustomer && (
                <button
                  onClick={() => {
                    setCustomerForm({
                      firstName: order.customer?.firstName || '',
                      lastName: order.customer?.lastName || '',
                      email: order.customer?.email || '',
                      phone: order.customer?.phone || ''
                    });
                    setEditingCustomer(true);
                  }}
                  className="text-[10px] font-black text-brand hover:text-brand/80 uppercase tracking-wider"
                >
                  Editar
                </button>
              )}
            </h3>

            {order.customer ? (
              isShopify && editingCustomer ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Nombre</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={customerForm.firstName}
                        onChange={(e) => setCustomerForm(f => ({ ...f, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Apellido</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={customerForm.lastName}
                        onChange={(e) => setCustomerForm(f => ({ ...f, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Email</label>
                    <input
                      className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="ghost" onClick={() => setEditingCustomer(false)} className="h-8 text-[10px]">Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveCustomer} disabled={savingCustomer} className="h-8 text-[10px]">
                      {savingCustomer ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-medium text-text-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-bg text-brand rounded-xl flex items-center justify-center font-black">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-text-primary">
                        {order.customer.firstName} {order.customer.lastName}
                      </h4>
                      <p className="text-[10px] font-bold text-text-muted uppercase mt-0.5">
                        {order.customer.numberOfOrders || 1} {order.customer.numberOfOrders === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {order.customer.email && (
                      <div className="flex items-center gap-2.5">
                        <Mail size={13} className="text-text-muted shrink-0" />
                        <span className="truncate">{order.customer.email}</span>
                      </div>
                    )}
                    {order.customer.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone size={13} className="text-text-muted shrink-0" />
                        <span>{order.customer.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <Button
                      variant="ghost"
                      onClick={() => router.push(`/contacts?id=${encodeURIComponent(order.cliente_id || order.customer?.phone || '')}`)}
                      className="text-[10px] font-bold text-brand hover:text-brand/80 hover:bg-transparent p-0 h-auto"
                    >
                      Ver Perfil del Cliente &rarr;
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-xs text-text-muted italic">No hay información de cliente.</p>
            )}
          </div>

          {/* Tags Box */}
          {isShopify && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-text-muted" />
                  <span>Etiquetas</span>
                </div>
                {!editingTags && (
                  <button
                    onClick={() => {
                      const current = Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
                      setTagsList(current);
                      setEditingTags(true);
                    }}
                    className="text-[10px] font-black text-brand hover:text-brand/80 uppercase tracking-wider"
                  >
                    Editar
                  </button>
                )}
              </h3>
              {editingTags ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {tagsList.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-bg text-brand text-[10px] font-black uppercase rounded-lg">
                        {tag}
                        <button
                          onClick={() => setTagsList(prev => prev.filter((_, idx) => idx !== i))}
                          className="hover:text-danger ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand"
                      placeholder="Agregar etiqueta..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          setTagsList(prev => [...prev, newTagInput.trim()]);
                          setNewTagInput('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newTagInput.trim()) {
                          setTagsList(prev => [...prev, newTagInput.trim()]);
                          setNewTagInput('');
                        }
                      }}
                      className="px-3 py-2 bg-brand text-white text-[10px] font-black uppercase rounded-xl hover:bg-brand/90"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="ghost" onClick={() => { setEditingTags(false); setNewTagInput(''); }} className="h-8 text-[10px]">Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveTags} disabled={savingTags} className="h-8 text-[10px]">
                      {savingTags ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])).length > 0 ? (
                    (Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])).map((tag: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-0.5 px-2 py-1 bg-brand-bg text-brand text-[10px] font-black uppercase rounded-lg">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-[10px] text-text-muted italic">Sin etiquetas</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Channel Info Box */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-text-primary">
              Origen del Pedido
            </h3>
            <div className="p-3 bg-card-alt rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Canal de ventas</p>
              <p className="text-xs font-black text-text-primary mt-1 uppercase">
                {order.canal === 'pagina_web' ? 'Shopify (Tienda Online)' : order.canal}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
