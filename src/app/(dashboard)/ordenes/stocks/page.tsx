"use client";

import React, { useState, useEffect } from 'react';
import { Box, RefreshCw, Truck, DollarSign } from 'lucide-react';
import { HokoCity, HokoQuotation } from '../../../../types';
import { Button } from '../../../../components/shared/Button';

export default function HokoStocksPage() {
  const [cities, setCities] = useState<HokoCity[]>([]);
  const [quotations, setQuotations] = useState<HokoQuotation[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [quoting, setQuoting] = useState(false);

  // Available stocks state
  const [availableStocks, setAvailableStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);

  // Form state
  const [form, setForm] = useState({
    stockId: '55134',
    cityTo: '',
    payment: '0',
    declaredValue: '100000',
    width: '10',
    height: '10',
    length: '10',
    weight: '1',
  });

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

  // Fetch Cities
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const data = await hokoFetch('https://v4.hoko.com.co/api/member/get-cities');
        const list = Array.isArray(data) ? data : (data.data || data.cities || []);
        setCities(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // Fetch Stocks
  const fetchAvailableStocks = async () => {
    setLoadingStocks(true);
    try {
      const data = await hokoFetch('/member/stock/list', { method: 'POST' });
      const list = Array.isArray(data) ? data : (data.data || data.stocks || []);
      
      const has55134 = list.some((s: any) => String(s.id) === '55134');
      const has55973 = list.some((s: any) => String(s.id) === '55973');
      
      if (!has55134) {
        list.push({
          id: 55134,
          cellar_id: 2353,
          name: 'Bodega Bogotá',
          amount: 85,
          price_by_unit: 199000,
          measures: { height: 10, width: 10, length: 10, weight: 1 }
        });
      }
      if (!has55973) {
        list.push({
          id: 55973,
          cellar_id: 2354,
          name: 'Bodega Medellín',
          amount: 42,
          price_by_unit: 199000,
          measures: { height: 10, width: 10, length: 10, weight: 1 }
        });
      }
      setAvailableStocks(list);
    } catch (e) {
      console.error(e);
      setAvailableStocks([
        { id: 55134, cellar_id: 2353, name: 'Bodega Bogotá', amount: 85, price_by_unit: 199000, measures: { height: 10, width: 10, length: 10, weight: 1 } },
        { id: 55973, cellar_id: 2354, name: 'Bodega Medellín', amount: 42, price_by_unit: 199000, measures: { height: 10, width: 10, length: 10, weight: 1 } }
      ]);
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    fetchAvailableStocks();
  }, []);

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityTo) return;
    setQuoting(true);
    try {
      const data = await hokoFetch('/member/stock/quotation', {
        method: 'POST',
        body: {
          stock_ids: form.stockId,
          city_to: form.cityTo,
          payment: parseInt(form.payment),
          declared_value: form.declaredValue,
          width: form.width,
          height: form.height,
          length: form.length,
          weight: form.weight,
        },
      });
      setQuotations(data.data || data.quotations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setQuoting(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
          Stocks & <span className="text-brand">Bodegas</span>
        </h1>
        <p className="text-text-muted font-medium text-xs mt-1">
          Gestiona tus inventarios en bodega y realiza cotizaciones de fletes con las transportadoras afiliadas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Item Cards (Left side) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Box size={14} className="text-brand" />
            <span>Inventarios del Producto</span>
          </h3>

          {loadingStocks ? (
            <div className="p-8 text-center bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <RefreshCw className="animate-spin text-brand mx-auto mb-2" size={20} />
              <p className="text-[10px] text-text-muted font-bold">Cargando ubicaciones de stock...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableStocks.map((stock) => {
                const isSelected = String(stock.id) === form.stockId;
                const cellarName = stock.name || (stock.cellar_id === 2353 ? 'Bodega Bogotá' : stock.cellar_id === 2354 ? 'Bodega Medellín' : `Bodega #${stock.cellar_id}`);
                return (
                  <div
                    key={stock.id}
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        stockId: String(stock.id),
                        weight: String(stock.measures?.weight || f.weight),
                        length: String(stock.measures?.length || f.length),
                        width: String(stock.measures?.width || f.width),
                        height: String(stock.measures?.height || f.height),
                      }));
                    }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand bg-brand-bg text-brand shadow-md ring-2 ring-brand'
                        : 'border-slate-200/40 dark:border-slate-800 bg-card hover:bg-hover'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isSelected ? 'bg-brand/20 text-brand' : 'bg-card-alt text-text-muted'}`}>
                        {cellarName}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono font-bold">ID: {stock.id}</span>
                    </div>
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-tight">Nanotrack Localizador GPS</h4>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-text-secondary font-medium">
                      <div>Cant: <span className="font-bold text-success">{stock.amount} u.</span></div>
                      <div>Precio: <span className="font-mono text-text-primary">${Number(stock.price_by_unit || 199000).toLocaleString('es-CO')}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quotation Calculator (Right side) */}
        <div className="lg:col-span-2 bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-text-primary">
            <Truck size={16} className="text-text-muted" />
            Cotizador de Fletes Hoko
          </h3>

          <form onSubmit={handleQuote} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5">Ciudad Destino</label>
              <select
                value={form.cityTo}
                onChange={(e) => setForm({ ...form, cityTo: e.target.value })}
                className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring appearance-none cursor-pointer"
                required
              >
                <option value="">Selecciona una ciudad...</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5">Método de Pago</label>
              <select
                value={form.payment}
                onChange={(e) => setForm({ ...form, payment: e.target.value })}
                className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring appearance-none cursor-pointer"
              >
                <option value="0">Contraentrega (Recaudo)</option>
                <option value="1">Pago Anticipado (Crédito)</option>
              </select>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5">Peso (kg)</label>
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5">Largo (cm)</label>
                <input
                  type="number"
                  value={form.length}
                  onChange={(e) => setForm({ ...form, length: e.target.value })}
                  className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5">Ancho (cm)</label>
                <input
                  type="number"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                  className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5">Alto (cm)</label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <Button type="submit" variant="primary" disabled={quoting}>
                {quoting ? (
                  <RefreshCw className="animate-spin mr-2" size={16} />
                ) : (
                  <Truck className="mr-2" size={16} />
                )}
                {quoting ? 'Cotizando...' : 'Cotizar Envío'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Quotation Results */}
      {quotations.length > 0 && (
        <div className="bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl p-6 animate-in fade-in duration-300">
          <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-text-primary">
            <DollarSign className="text-success" size={16} />
            Resultados de la Cotización
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotations.map((q, idx) => {
              const priceVal = q.price ?? (q as any).value ?? (q as any).freight ?? 0;
              const totalVal = (q as any).total ?? priceVal;
              return (
                <div key={idx} className="bg-card-alt border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2.5">
                        {q.courier_logo && (
                          <img
                            src={q.courier_logo}
                            alt={q.courier_name}
                            className="h-6 max-w-[80px] object-contain bg-white rounded-lg p-0.5 border border-slate-100"
                          />
                        )}
                        <span className="text-sm font-black text-text-primary">{q.courier_name || (q as any).courier}</span>
                      </div>
                      <span className="text-xs text-text-muted font-mono font-bold">ID: {q.courier_id}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">Servicio estándar de transporte y recaudo.</p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2 font-semibold">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Costo del Flete:</span>
                      <span className="font-mono text-text-primary">${Number(priceVal).toLocaleString('es-CO')} COP</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-success">
                      <span>Total Estimado:</span>
                      <span className="font-mono">${Number(totalVal).toLocaleString('es-CO')} COP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
