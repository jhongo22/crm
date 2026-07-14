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
        {/* Stock Item Card */}
        <div className="lg:col-span-1 bg-card border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="bg-brand/10 text-brand text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                Bodega Principal
              </span>
              <span className="text-text-muted text-xs font-mono">ID: {form.stockId}</span>
            </div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Box className="text-brand" size={20} />
              Accesorio Localizador GPS
            </h2>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Dispositivo de rastreo y seguridad satelital para vehículos y tags.
            </p>

            <div className="mt-6 space-y-3 font-medium">
              <div className="flex justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-text-secondary">Disponible:</span>
                <span className="font-bold text-success">En Stock</span>
              </div>
              <div className="flex justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-text-secondary">Peso base:</span>
                <span className="font-mono text-text-primary">{form.weight} kg</span>
              </div>
              <div className="flex justify-between text-xs py-1.5">
                <span className="text-text-secondary">Dimensiones:</span>
                <span className="font-mono text-text-primary">{form.length}x{form.width}x{form.height} cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quotation Calculator */}
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
                className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
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
                className="w-full bg-input border border-slate-200/50 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-ring"
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
            {quotations.map((q, idx) => (
              <div key={idx} className="bg-card-alt border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-text-primary">{q.courier_name || (q as any).courier}</span>
                    <span className="text-xs text-text-muted font-mono">ID: {q.courier_id}</span>
                  </div>
                  <p className="text-xs text-text-secondary">Servicio estándar de transporte y recaudo.</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 font-medium">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Costo del Flete:</span>
                    <span className="font-mono text-text-primary">${(q as any).freight?.toLocaleString() || q.price?.toLocaleString()} COP</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-success">
                    <span>Total Estimado:</span>
                    <span className="font-mono">${(q as any).total?.toLocaleString()} COP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
