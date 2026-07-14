"use client";

import React, { useState, useEffect } from 'react';
import { Package, Tag, ShoppingCart, RefreshCw, Info, X, MapPin } from 'lucide-react';
import { Button } from '../../../../components/shared/Button';
import { useRouter } from 'next/navigation';

export default function HokoProductosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await hokoFetch('/member/product/list-with-stock');
      const list = Array.isArray(data) ? data : (data.data || data.products || []);
      setProducts(list);
    } catch (e) {
      console.error('Error fetching products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleViewDetail = async (id: number) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    setSelectedProduct(null);
    try {
      const data = await hokoFetch(`/member/product/detail?id=${id}`);
      const detail = data.data || data.product || data;
      setSelectedProduct(detail);
    } catch (e) {
      console.error('Error fetching product details', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Pricing rules (fallback to API dynamic pricing or default GPS structure)
  const getUnitPrice = (p: any, qty: number) => {
    const base = Number(p.price_by_unit || p.minimal_price || 199000);
    if (p.reference === 'abc123' || p.name?.toLowerCase().includes('gps')) {
      if (qty >= 3) return 139300;
      if (qty === 2) return 159200;
      return 199000;
    }
    return base;
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
            Catálogo de <span className="text-brand">Productos</span>
          </h1>
          <p className="text-text-muted font-medium text-xs mt-1">
            Consulta en tiempo real el inventario físico y precios sugeridos de tus productos en las bodegas de Hoko.
          </p>
        </div>
        <Button variant="ghost" onClick={fetchProducts} className="h-10 px-4 rounded-xl flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Sincronizar Catálogo
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[32px] border border-slate-200/50 dark:border-slate-800">
          <RefreshCw size={32} className="animate-spin text-brand" />
          <p className="text-xs text-text-muted font-bold mt-4">Obteniendo productos con stock disponible...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const hasStock = p.stock && p.stock.length > 0;
            const totalStock = hasStock ? p.stock.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0) : 0;
            return (
              <div key={p.id} className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="aspect-video bg-card-alt border border-slate-100 dark:border-slate-800/60 rounded-xl flex items-center justify-center relative overflow-hidden group">
                    <Package size={48} className="text-brand/40 group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute top-2.5 left-2.5 bg-brand text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Ref: {p.reference || 'S/R'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-tight line-clamp-1">{p.name}</h3>
                    <p className="text-[10px] text-text-muted font-medium mt-1 line-clamp-2">{p.description || 'Sin descripción detallada.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[8px] text-text-placeholder block font-sans font-bold uppercase">Costo</span>
                      <span className="font-bold text-text-secondary">${Number(p.cost || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-text-placeholder block font-sans font-bold uppercase">Sugerido</span>
                      <span className="font-black text-brand">${Number(p.price_by_unit || p.minimal_price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
                    <span>Bodegas Activas:</span>
                    <span className="px-2 py-0.5 rounded bg-card-alt border border-slate-100 dark:border-slate-800 font-mono text-text-primary">
                      {p.stock?.length || 0} bodegas
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
                    <span>Existencia Total:</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold ${totalStock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {totalStock} unidades
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" onClick={() => handleViewDetail(p.id)} className="flex-1 text-[10px] font-black uppercase tracking-wider h-9 rounded-xl">
                      Ver Bodegas
                    </Button>
                    <Button variant="primary" onClick={() => router.push('/ordenes')} className="flex-1 text-[10px] font-black uppercase tracking-wider h-9 rounded-xl gap-1">
                      <ShoppingCart size={12} />
                      Vender
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
          <Package size={48} className="text-text-placeholder mx-auto mb-4" />
          <p className="text-sm text-text-muted font-bold">No se encontraron productos con stock en tu cuenta Hoko.</p>
        </div>
      )}

      {/* ── Product Detail & Warehouse Stock Modal ── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-card rounded-[32px] border border-slate-200/50 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[70vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-brand text-[9px] font-black uppercase tracking-widest">Detalle de Inventario por Bodega</span>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight mt-0.5">
                  {selectedProduct?.name || 'Cargando producto...'}
                </h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-hover rounded-xl text-text-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <RefreshCw size={24} className="animate-spin text-brand" />
                  <p className="text-[10px] text-text-muted font-bold mt-3">Consultando stocks por ID en Hoko...</p>
                </div>
              ) : selectedProduct ? (
                <div className="space-y-6">
                  {/* General Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900/55 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/80">
                      <span className="text-[8px] text-text-placeholder uppercase font-bold">Referencia</span>
                      <span className="block text-xs font-black text-text-primary mt-1 font-mono">{selectedProduct.reference || 'abc123'}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/55 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/80">
                      <span className="text-[8px] text-text-placeholder uppercase font-bold">Precio Mayorista</span>
                      <span className="block text-xs font-black text-text-primary mt-1 font-mono">${Number(selectedProduct.price_by_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/55 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/80">
                      <span className="text-[8px] text-text-placeholder uppercase font-bold">Dropshipping</span>
                      <span className="block text-xs font-black text-text-primary mt-1 font-mono">${Number(selectedProduct.price_dropshipping || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/55 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/80">
                      <span className="text-[8px] text-text-placeholder uppercase font-bold">Impuesto (Tax)</span>
                      <span className="block text-xs font-black text-text-primary mt-1">{selectedProduct.tax === 1 ? 'IVA 19%' : 'Exento'}</span>
                    </div>
                  </div>

                  {/* Calculator Widget */}
                  <div className="bg-card-alt border border-slate-100 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={12} className="text-brand" />
                      Calculadora de Precios Dinámicos
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="1"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-input border border-slate-200/40 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
                      />
                      <div className="flex-1">
                        <span className="text-[8px] text-text-placeholder uppercase font-bold">P. Unitario</span>
                        <p className="text-xs font-bold font-mono text-text-primary mt-0.5">${getUnitPrice(selectedProduct, selectedQuantity).toLocaleString()} COP</p>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-placeholder uppercase font-bold">Total Estimado</span>
                        <p className="text-sm font-black font-mono text-success mt-0.5">${(getUnitPrice(selectedProduct, selectedQuantity) * selectedQuantity).toLocaleString()} COP</p>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Distribution List */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-text-primary uppercase tracking-wider">Disponibilidad en Bodegas</h4>
                    {selectedProduct.stock && selectedProduct.stock.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProduct.stock.map((st: any, idx: number) => {
                          const cellarName = st.cellar?.name || (st.cellar_id === 2353 ? 'Bodega Bogotá' : st.cellar_id === 2354 ? 'Bodega Medellín' : `Bodega #${st.cellar_id}`);
                          return (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-card hover:bg-hover transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center text-text-muted">
                                  <MapPin size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-text-primary">{cellarName}</p>
                                  <p className="text-[9px] text-text-placeholder font-mono mt-0.5">Cellar ID: {st.cellar_id} {st.all_stores === 1 && '• Tiendas habilitadas'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-mono font-bold ${Number(st.amount || 0) > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                  {st.amount || 0} unidades
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic">No hay inventarios reportados en ninguna bodega para este producto.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-text-muted italic">Error al cargar la ficha del producto.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 flex justify-end gap-2 bg-card">
              <Button variant="ghost" onClick={() => setShowDetailModal(false)} className="h-10 px-5 rounded-xl text-xs font-bold">Cerrar</Button>
              <Button variant="primary" onClick={() => { setShowDetailModal(false); router.push('/ordenes'); }} className="h-10 px-6 rounded-xl text-xs font-black uppercase tracking-wider gap-2">
                <ShoppingCart size={13} />
                Comenzar Venta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
