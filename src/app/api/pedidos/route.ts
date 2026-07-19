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
    const urlParams = new URL(request.url).searchParams;
    const orderIdParam = urlParams.get('id');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    logger.info('Consultando tabla "pedidos" en Supabase...');
    
    let dbQuery = supabase
      .from('pedidos')
      .select('*, clientes(*)');
      
    if (orderIdParam) {
      dbQuery = dbQuery.eq('id', orderIdParam);
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data: dbPedidos, error: dbError } = await dbQuery;

    if (dbError) {
      logger.error('Error al consultar Supabase pedidos:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    logger.info(`Pedidos obtenidos de Supabase: ${dbPedidos?.length || 0} registros`);

    if (!dbPedidos || dbPedidos.length === 0) {
      return NextResponse.json(orderIdParam ? null : []);
    }

    const orders: any[] = [];

    // Map database fields to standard response format
    const dbOrdersList = dbPedidos.map((p: any) => {
      const canalStr = p.clientes?.canal || 'whatsApp';
      const cleanClienteId = p.cliente_id || '';
      
      let shopifyOrderId = null;
      let shopifyOrderName = '';
      
      if (canalStr === 'pagina_web') {
        if (cleanClienteId.startsWith('cliente_tienda_pedido_')) {
          const num = cleanClienteId.replace('cliente_tienda_pedido_', '');
          shopifyOrderId = `gid://shopify/Order/${num}`;
          shopifyOrderName = `#${num}`;
        } else if (/^\d+$/.test(cleanClienteId)) {
          shopifyOrderId = `gid://shopify/Order/${cleanClienteId}`;
          shopifyOrderName = `#${cleanClienteId}`;
        } else {
          shopifyOrderId = cleanClienteId;
          shopifyOrderName = cleanClienteId.split('/').pop() || 'Shopify';
        }
      } else {
        shopifyOrderName = `Chat: #${p.id}`;
      }

      return {
        id: p.hoko_order_id || `db-${p.id}`,
        db_id: p.id,
        hoko_order_id: p.hoko_order_id,
        hoko_store_id: p.hoko_store_id,
        quantity: p.quantity || 1,
        stock_id: p.stock_id,
        courier_id: p.courier_id,
        courier_name: p.courier_name,
        payment_type: p.payment_type,
        total_paid: p.total_paid,
        created_at: p.created_at,
        updated_at: p.updated_at,
        canal: canalStr,
        customer: {
          name: p.clientes?.nombre || '—',
          email: p.clientes?.email || '—',
          phone: p.clientes?.telefono || '—',
          address: p.clientes?.direccion || '—',
          identification: p.clientes?.identificacion || '—',
          city: p.clientes?.ciudad || '—',
        },
        shopify_order_id: shopifyOrderId,
        shopify_order_name: shopifyOrderName,
      };
    });

    // Fetch Hoko details in parallel for orders with hoko_order_id
    await Promise.all(dbOrdersList.map(async (fullOrder) => {
      if (!fullOrder.hoko_order_id) {
        orders.push(fullOrder);
        return;
      }
      try {
        const hokoId = fullOrder.hoko_order_id;
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
          orders.push(fullOrder);
          return;
        }

        const hokoOrder = detail.data || detail;
        const mergedOrder = {
          ...fullOrder,
          ...hokoOrder,
          id: hokoOrder.id || fullOrder.id,
          db_id: fullOrder.db_id,
          canal: fullOrder.canal,
          shopify_order_id: fullOrder.shopify_order_id,
          shopify_order_name: fullOrder.shopify_order_name,
        };

        if (fullOrder.customer.name !== '—') {
          mergedOrder.customer = {
            ...mergedOrder.customer,
            name: fullOrder.customer.name,
            email: fullOrder.customer.email,
            phone: fullOrder.customer.phone,
            address: fullOrder.customer.address,
            identification: fullOrder.customer.identification,
            city: fullOrder.customer.city,
          };
        }

        orders.push(mergedOrder);
      } catch (e: any) {
        logger.error(`Error al procesar orden ${fullOrder.hoko_order_id} en servidor:`, { message: e.message, stack: e.stack });
        orders.push(fullOrder);
      }
    }));

    // Sort orders by created_at desc (to match DB order)
    orders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const responsePayload = orderIdParam ? (orders[0] || null) : orders;
    logger.info(`Retornando ${orderIdParam ? 'pedido único' : `${orders.length} pedidos unificados`}`);
    
    return new NextResponse(JSON.stringify(responsePayload), {
      status: orderIdParam && !orders[0] ? 404 : 200,
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
