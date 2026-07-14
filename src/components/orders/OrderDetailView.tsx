"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, ShoppingBag, MapPin, User, Mail, Phone, Calendar, Clipboard, CreditCard, Box, Tag, Shield, Clock, RotateCcw, Receipt, Globe, Hash } from 'lucide-react';
import { ShopifyOrder } from '../../types';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';

interface OrderDetailViewProps {
  orderId: string | null;
  onBack: () => void;
}

export function OrderDetailView({ orderId, onBack }: OrderDetailViewProps) {
  const [order, setOrder] = useState<ShopifyOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ firstName: '', lastName: '', company: '', address1: '', address2: '', city: '', province: '', zip: '', country: '', phone: '' });
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    setErrorMessage(null);
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
                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }
                subtotalPriceSet {
                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }
                totalShippingPriceSet {
                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }
                totalTaxSet {
                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  id
                  firstName
                  lastName
                  email
                  phone
                  numberOfOrders
                }
                shippingAddress {
                  firstName
                  lastName
                  company
                  address1
                  address2
                  city
                  province
                  zip
                  country
                  phone
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      sku
                      originalUnitPriceSet {
                        presentmentMoney {
                          amount
                          currencyCode
                        }
                      }
                      image {
                        url
                      }
                    }
                  }
                }
                fulfillmentOrders(first: 5) {
                  edges {
                    node {
                      id
                      status
                    }
                  }
                }
                paymentGatewayNames
                discountCodes
                billingAddressMatchesShippingAddress
                billingAddress {
                  firstName
                  lastName
                  address1
                  address2
                  city
                  province
                  zip
                  country
                  phone
                }
                risk {
                  recommendation
                }
                fullyPaid
                cancelReason
                confirmationNumber
                sourceName
                email
                phone
                poNumber
                clientIp
                shippingLine {
                  title
                }
                returns(first: 5) {
                  edges {
                    node {
                      status
                    }
                  }
                }
                refunds(first: 5) {
                  id
                  createdAt
                }
                events(first: 10) {
                  edges {
                    node {
                      id
                      message
                      createdAt
                    }
                  }
                }
              }
            }
          `,
          variables: { id: orderId }
        })
      });
      const data = await response.json();
      if (data?.data?.order) {
        setOrder(data.data.order);
      } else if (data?.errors) {
        setErrorMessage(data.errors[0]?.message || 'Error de GraphQL');
      } else {
        setErrorMessage('Pedido no encontrado en Shopify');
      }
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
                fulfillment {
                  id
                  status
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            fulfillment: {
              lineItemsByFulfillmentOrder: [
                {
                  fulfillmentOrderId: fulfillmentOrderId
                }
              ],
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
                order {
                  id
                  displayFinancialStatus
                }
                userErrors {
                  field
                  message
                }
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
                order { id note tags }
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
      'amex': 'American Express',
      'paypal': 'PayPal',
      'paypal_express': 'PayPal Express',
      'nequi': 'Nequi',
      'bancolombia': 'Bancolombia',
      'daviplata': 'DaviPlata',
      'pse': 'PSE',
      'mercado_pago': 'Mercado Pago',
      'mercadopago': 'Mercado Pago',
      'wompi': 'Wompi',
      'epayco': 'ePayco',
      'place_to_pay': 'Place to Pay',
      'addi': 'Addi',
      'sistecredito': 'SisteCrédito',
    };
    return map[name] || name;
  };

  const translateEventMessage = (msg: string): string => {
    const map: Record<string, string> = {
      'Fulfilled': 'Preparado',
      'Unfulfilled': 'No preparado',
      'Paid': 'Pagado',
      'Refunded': 'Reembolsado',
      'Partially refunded': 'Parcialmente reembolsado',
      'Canceled': 'Cancelado',
      'Cancelled': 'Cancelado',
      'Restocked': 'Reabastecido',
    };
    return map[msg] || msg;
  };

  const translateSourceName = (name: string): string => {
    const map: Record<string, string> = {
      'web': 'Web',
      'shopify_draft_order': 'Borrador Shopify',
      'pos': 'POS',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'tiktok': 'TikTok',
      'whatsapp': 'WhatsApp',
      'manual': 'Manual',
    };
    const key = name.replace(/_/g, ' ').toLowerCase();
    return map[name] || map[key] || name.replace(/_/g, ' ');
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

  const payment = getFinancialStatusLabel(order.displayFinancialStatus);
  const fulfillment = getFulfillmentStatusLabel(order.displayFulfillmentStatus);
  const totalItems = order.lineItems.edges.reduce((sum, edge) => sum + edge.node.quantity, 0);

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
            {order.sourceName && (
              <span className="ml-2 flex items-center gap-1">
                <Globe size={11} />
                <span className="capitalize">{translateSourceName(order.sourceName)}</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.displayFulfillmentStatus === 'UNFULFILLED' && (
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg rounded-xl border border-brand/15">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    <span className="text-[10px] font-black text-brand uppercase tracking-wider">inventarioHoko</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="px-6 py-3 space-y-1">
              {order.lineItems.edges.map((edge) => {
                const item = edge.node;
                return (
                  <div key={item.id} className="group rounded-2xl bg-card-alt/50 hover:bg-card-alt transition-colors px-4 py-3 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-card border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {item.image?.url ? (
                        <img src={item.image.url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="text-text-muted/30" size={18} />
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
                        {formatPrice(item.originalUnitPriceSet.presentmentMoney.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Actions */}
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
                {order.displayFulfillmentStatus === 'UNFULFILLED' && (
                  <Button 
                    variant="primary" 
                    onClick={handleFulfill}
                    disabled={fulfilling} 
                    className="h-9 text-[11px] font-black uppercase tracking-wider px-4"
                  >
                    {fulfilling ? 'Preparando...' : 'Marcar como preparado'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Summary Box */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center gap-2">
              <CreditCard size={15} className="text-text-muted" />
              <span>Detalles Financieros</span>
            </h3>

            <div className="space-y-2 text-xs font-medium text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})</span>
                <span className="text-text-primary font-bold">{formatPrice(order.subtotalPriceSet?.presentmentMoney.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-text-primary font-bold">{formatPrice(order.totalShippingPriceSet?.presentmentMoney.amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3 text-sm font-black text-text-primary">
                <span>Total</span>
                <span>{formatPrice(order.totalPriceSet.presentmentMoney.amount)}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-3 space-y-2 text-xs font-medium text-text-secondary">
              {order.paymentGatewayNames && order.paymentGatewayNames.length > 0 && (
                <div className="flex justify-between">
                  <span>Pasarela de pago</span>
                  <span className="text-text-primary font-bold text-right">{order.paymentGatewayNames.map(translateGatewayName).join(', ')}</span>
                </div>
              )}
              {order.discountCodes && order.discountCodes.length > 0 && (
                <div className="flex justify-between">
                  <span>Códigos de descuento</span>
                  <span className="text-text-primary font-bold text-right">{order.discountCodes.join(', ')}</span>
                </div>
              )}
              {order.fullyPaid !== undefined && (
                <div className="flex justify-between">
                  <span>Pagado completo</span>
                  <span className={`font-bold ${order.fullyPaid ? 'text-success' : 'text-warning'}`}>
                    {order.fullyPaid ? 'Sí' : 'No'}
                  </span>
                </div>
              )}
              {order.poNumber && (
                <div className="flex justify-between">
                  <span>Orden de compra</span>
                  <span className="text-text-primary font-bold">{order.poNumber}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center bg-card-alt p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Pagado por el cliente</p>
                <p className="text-base font-black text-text-primary mt-0.5">
                  {order.displayFinancialStatus === 'PAID' ? formatPrice(order.totalPriceSet.presentmentMoney.amount) : '$0'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Saldo pendiente</p>
                <p className="text-base font-black text-text-primary mt-0.5 text-right">
                  {order.displayFinancialStatus === 'PAID' ? '$0' : formatPrice(order.totalPriceSet.presentmentMoney.amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Events Box */}
          {order.events?.edges && order.events.edges.length > 0 && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center gap-2">
                <Clock size={15} className="text-text-muted" />
                <span>Cronología</span>
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...order.events.edges].reverse().map((ev) => (
                  <div key={ev.node.id} className="flex gap-3 text-xs">
                    <div className="shrink-0 w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div>
                      <p className="text-[10px] font-bold text-text-muted">
                        {new Date(ev.node.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                      {ev.node.message ? (
                        <p className="font-medium text-text-secondary mt-0.5">{translateEventMessage(ev.node.message)}</p>
                      ) : (
                        <p className="text-text-muted italic">Evento registrado</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Notes Box */}
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

          {/* Shipping Address Box */}
          {order.shippingAddress && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-text-muted" />
                  <span>Dirección de envío</span>
                </div>
                {!editingAddress && (
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

              {editingAddress ? (
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
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Empresa</label>
                    <input
                      className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={addressForm.company}
                      onChange={(e) => setAddressForm(f => ({ ...f, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Dirección</label>
                    <input
                      className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={addressForm.address1}
                      onChange={(e) => setAddressForm(f => ({ ...f, address1: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Apartamento, local, etc.</label>
                    <input
                      className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={addressForm.address2}
                      onChange={(e) => setAddressForm(f => ({ ...f, address2: e.target.value }))}
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
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Provincia</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={addressForm.province}
                        onChange={(e) => setAddressForm(f => ({ ...f, province: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Código postal</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={addressForm.zip}
                        onChange={(e) => setAddressForm(f => ({ ...f, zip: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">País</label>
                      <input
                        className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm(f => ({ ...f, country: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Teléfono</label>
                    <input
                      className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                    />
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
                  {order.shippingAddress.company && <p className="text-text-muted">{order.shippingAddress.company}</p>}
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.province || ''}</p>
                  <p>{order.shippingAddress.country} {order.shippingAddress.zip ? `- ${order.shippingAddress.zip}` : ''}</p>
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
              {order.customer && !editingCustomer && (
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
              editingCustomer ? (
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
                  <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Teléfono</label>
                    <input
                      className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm(f => ({ ...f, phone: e.target.value }))}
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
                    <div className="flex items-center gap-2.5">
                      <Mail size={13} className="text-text-muted shrink-0" />
                      <span className="truncate">{order.customer.email}</span>
                    </div>
                    {order.customer.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone size={13} className="text-text-muted shrink-0" />
                        <span>{order.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <p className="text-xs text-text-muted italic">No hay información de cliente.</p>
            )}
          </div>

          {/* Tags Box */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-text-muted" />
                <span>Etiquetas</span>
              </div>
              {!editingTags && (
                <button
                  onClick={() => {
                    const current = Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
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
                {(Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map(t => t.trim()).filter(Boolean) : [])).length > 0 ? (
                  (Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map(t => t.trim()).filter(Boolean) : [])).map((tag, i) => (
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

          {/* Channel Info Box */}
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-text-primary">
              Origen del Pedido
            </h3>
            <div className="p-3 bg-card-alt rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Canal de ventas</p>
              <p className="text-xs font-black text-text-primary mt-1">
                {order.channelInformation?.channelDefinition?.channelName || 'Pedidos preliminares'}
              </p>
            </div>
            {order.risk?.recommendation && (
              <div className="flex items-center justify-between p-3 bg-card-alt rounded-2xl border border-slate-200/50 dark:border-slate-800">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Riesgo</p>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  order.risk.recommendation === 'CANCEL' ? 'bg-danger-bg text-danger' :
                  order.risk.recommendation === 'INVESTIGATE' ? 'bg-warning-bg text-warning' :
                  'bg-success-bg text-success'
                }`}>
                  {order.risk.recommendation === 'CANCEL' ? 'Cancelar' :
                   order.risk.recommendation === 'INVESTIGATE' ? 'Investigar' :
                   order.risk.recommendation === 'ACCEPT' ? 'Aceptar' :
                   order.risk.recommendation}
                </span>
              </div>
            )}
          </div>

          {/* Billing Address Box */}
          {order.billingAddress && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary border-b border-slate-100 dark:border-slate-800/50 pb-3 flex items-center gap-2">
                <Receipt size={15} className="text-text-muted" />
                <span>Dirección de facturación</span>
              </h3>

              {order.billingAddressMatchesShippingAddress !== undefined && order.billingAddressMatchesShippingAddress ? (
                <p className="text-[11px] text-text-muted italic font-medium">Igual que la dirección de envío</p>
              ) : (
                <div className="text-xs text-text-secondary space-y-1 font-medium">
                  <p className="font-black text-text-primary">
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </p>
                  <p>{order.billingAddress.address1}</p>
                  {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                  <p>{order.billingAddress.city}, {order.billingAddress.province || ''}</p>
                  <p>{order.billingAddress.country} {order.billingAddress.zip ? `- ${order.billingAddress.zip}` : ''}</p>
                  {order.billingAddress.phone && (
                    <p className="pt-2 flex items-center gap-1.5">
                      <Phone size={11} className="text-text-muted" />
                      <span>{order.billingAddress.phone}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cancel Reason */}
          {order.cancelReason && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center gap-2">
                <RotateCcw size={14} className="text-text-muted" />
                <span>Razón de cancelación</span>
              </h3>
              <p className="text-xs font-bold text-danger capitalize">
                {order.cancelReason.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
          )}

          {/* Returns Box */}
          {order.returns?.edges && order.returns.edges.length > 0 && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center gap-2">
                <RotateCcw size={14} className="text-text-muted" />
                <span>Devoluciones</span>
              </h3>
              <div className="space-y-2">
                {order.returns.edges.map((ret, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-medium">
                    <span className="text-text-muted">Devolución #{i + 1}</span>
                    <span className={`font-bold uppercase text-[10px] ${
                      ret.node.status === 'OPEN' ? 'text-warning' :
                      ret.node.status === 'COMPLETED' ? 'text-success' :
                      'text-text-muted'
                    }`}>
                      {ret.node.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refunds Box */}
          {order.refunds && order.refunds.length > 0 && (
            <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Receipt size={14} className="text-text-muted" />
                <span>Reembolsos</span>
              </h3>
              <div className="space-y-2">
                {order.refunds.map((ref, i) => (
                  <div key={ref.id} className="flex items-center justify-between text-xs font-medium">
                    <span className="text-text-muted">Reembolso #{i + 1}</span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(ref.createdAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
