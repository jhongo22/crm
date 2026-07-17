import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const HOKO_BASE = process.env.HOKO_BASE_URL || 'https://hoko.com.co/api';
const HOKO_TOKEN = process.env.HOKO_API_TOKEN || '';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  logger.info('=== INICIO GET /api/pedidos (SERVER SIDE) ===');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    logger.info('Consultando tabla "pedidos" en Supabase...');
    const { data: dbPedidos, error: dbError } = await supabase
      .from('pedidos')
      .select('*, clientes(*)')
      .order('created_at', { ascending: false });

    if (dbError) {
      logger.error('Error al consultar Supabase pedidos:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    logger.info(`Pedidos obtenidos de Supabase: ${dbPedidos?.length || 0} registros`);

    if (!dbPedidos || dbPedidos.length === 0) {
      return NextResponse.json([]);
    }

    // Map hoko_order_id
    const dbPedidosMap = new Map();
    const hokoIds: number[] = [];
    dbPedidos.forEach((p: any) => {
      if (p.hoko_order_id) {
        const idNum = Number(p.hoko_order_id);
        dbPedidosMap.set(idNum, p);
        hokoIds.push(idNum);
      }
    });

    logger.info('IDs de Hoko extraídos para consultar:', hokoIds);

    const orders: any[] = [];

    // Fetch details from Hoko in parallel
    await Promise.all(hokoIds.map(async (hokoId) => {
      try {
        const url = `${HOKO_BASE}/member/order/${hokoId}`;
        logger.info(`Llamando Hoko para detalle: ${url}`);
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${HOKO_TOKEN}`,
            Accept: 'application/json',
          },
          cache: 'no-store'
        });
        const detail = await res.json();
        logger.info(`Respuesta Hoko para orden ${hokoId}:`, detail);

        if (detail.error) {
          logger.error(`Error de Hoko para orden ${hokoId}:`, detail.error);
          return;
        }

        const hokoOrder = detail.data || detail;
        const fullOrder = { ...hokoOrder };

        const dbData = dbPedidosMap.get(hokoId);
        if (dbData) {
          fullOrder.quantity = dbData.quantity || 1;
          if (dbData.clientes) {
            fullOrder.customer = {
              ...fullOrder.customer,
              name: dbData.clientes.nombre || fullOrder.customer?.name,
              email: dbData.clientes.email || fullOrder.customer?.email,
              phone: dbData.clientes.telefono || fullOrder.customer?.phone,
              address: dbData.clientes.direccion || fullOrder.customer?.address,
              identification: dbData.clientes.identificacion || fullOrder.customer?.identification,
            };
          }
          const matches = dbData.cliente_id?.match(/pedido_(\d+)/);
          fullOrder.shopify_order_name = matches ? `#${matches[1]}` : (dbData.cliente_id?.startsWith('cliente_tienda_pedido_') ? `#${dbData.cliente_id.replace('cliente_tienda_pedido_', '')}` : `Hoko: #${hokoId}`);
          
          if (dbData.cliente_id) {
            if (/^\d+$/.test(dbData.cliente_id)) {
              fullOrder.shopify_order_id = `gid://shopify/Order/${dbData.cliente_id}`;
            } else {
              fullOrder.shopify_order_id = dbData.cliente_id;
            }
          }
        }

        if (fullOrder.guide?.number || fullOrder.guide_id || fullOrder.guide_number) {
          orders.push(fullOrder);
        }
      } catch (e: any) {
        logger.error(`Error al procesar orden ${hokoId} en servidor:`, { message: e.message, stack: e.stack });
      }
    }));

    // Sort orders by created_at desc (to match DB order)
    orders.sort((a, b) => {
      const dbA = dbPedidosMap.get(Number(a.id));
      const dbB = dbPedidosMap.get(Number(b.id));
      if (!dbA || !dbB) return 0;
      return new Date(dbB.created_at).getTime() - new Date(dbA.created_at).getTime();
    });

    logger.info(`Retornando ${orders.length} órdenes filtradas y enriquecidas`);
    return new NextResponse(JSON.stringify(orders), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    logger.error('Excepción en GET /api/pedidos:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    logger.info('=== FIN GET /api/pedidos (SERVER SIDE) ===');
  }
}
