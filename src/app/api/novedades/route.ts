import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const HOKO_BASE = process.env.HOKO_BASE_URL || 'https://hoko.com.co/api';
const HOKO_TOKEN = process.env.HOKO_API_TOKEN || '';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  logger.info('=== INICIO GET /api/novedades (SERVER SIDE) ===');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fetch Hoko novelties
    logger.info('Llamando a Hoko /member/novelties...');
    const hokoRes = await fetch(`${HOKO_BASE}/member/novelties`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HOKO_TOKEN}`,
        Accept: 'application/json',
      },
      cache: 'no-store'
    });
    
    const data = await hokoRes.json();
    logger.info('Respuesta de Hoko novelties:', data);

    if (data.error) {
      logger.error('Error de Hoko novelties:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    const list = Array.isArray(data) ? data : (data.data || data.novelties || data.orders || []);
    logger.info(`Novedades crudas obtenidas: ${list.length} registros`);

    if (list.length === 0) {
      return NextResponse.json([]);
    }

    // Query Supabase for matching store orders
    const hokoIds = list.map((o: any) => Number(o.id));
    logger.info('Consultando Supabase para hoko_order_ids:', hokoIds);
    const { data: dbPedidos, error: dbError } = await supabase
      .from('pedidos')
      .select('*, clientes(*)')
      .in('hoko_order_id', hokoIds);

    if (dbError) {
      logger.error('Error al consultar Supabase pedidos:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    logger.info(`Pedidos coincidentes en Supabase: ${dbPedidos?.length || 0} registros`);

    const dbPedidosMap = new Map();
    dbPedidos?.forEach((p: any) => {
      dbPedidosMap.set(Number(p.hoko_order_id), p);
    });

    // Filter and enrich list
    const enrichedList = list
      .filter((o: any) => dbPedidosMap.has(Number(o.id)))
      .map((o: any) => {
        const dbData = dbPedidosMap.get(Number(o.id));
        const enriched = { ...o };
        if (dbData) {
          if (dbData.clientes) {
            enriched.customer = {
              ...enriched.customer,
              name: dbData.clientes.nombre || enriched.customer?.name,
              email: dbData.clientes.email || enriched.customer?.email,
              phone: dbData.clientes.telefono || enriched.customer?.phone,
              address: dbData.clientes.direccion || enriched.customer?.address,
              identification: dbData.clientes.identificacion || enriched.customer?.identification,
            };
          }
          const matches = dbData.cliente_id?.match(/pedido_(\d+)/);
          enriched.shopify_order_name = matches ? `#${matches[1]}` : (dbData.cliente_id?.startsWith('cliente_tienda_pedido_') ? `#${dbData.cliente_id.replace('cliente_tienda_pedido_', '')}` : `Hoko: #${o.id}`);
        }
        return enriched;
      });

    logger.info(`Retornando ${enrichedList.length} novedades filtradas y enriquecidas`);
    return new NextResponse(JSON.stringify(enrichedList), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    logger.error('Excepción en GET /api/novedades:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    logger.info('=== FIN GET /api/novedades (SERVER SIDE) ===');
  }
}
