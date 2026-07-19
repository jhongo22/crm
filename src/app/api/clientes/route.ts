import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const clientIdParam = urlParams.get('id');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (clientIdParam) {
      // 1. Get client info
      const { data: client, error: clientError } = await supabase
        .from('clientes')
        .select('*')
        .eq('cliente_id', clientIdParam)
        .maybeSingle();

      if (clientError) {
        return NextResponse.json({ error: clientError.message }, { status: 500 });
      }

      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }

      // 2. Get client's orders
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', clientIdParam)
        .order('created_at', { ascending: false });

      if (ordersError) {
        return NextResponse.json({ error: ordersError.message }, { status: 500 });
      }

      return NextResponse.json({
        ...client,
        orders: orders || []
      });
    } else {
      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      if (clientsError) {
        return NextResponse.json({ error: clientsError.message }, { status: 500 });
      }

      return NextResponse.json(clients || []);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
