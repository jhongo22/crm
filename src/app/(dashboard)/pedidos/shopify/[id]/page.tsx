"use client";

import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const OrderDetailView = dynamic(() => import('../../../../../components/orders/OrderDetailView').then(m => m.OrderDetailView), { ssr: false });

export default function ShopifyOrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <OrderDetailView
      orderId={decodeURIComponent(params.id as string)}
      onBack={() => router.push('/pedidos/shopify')}
    />
  );
}
