import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

export async function POST(request: NextRequest) {
  let requestPayload: any = {};
  try {
    requestPayload = await request.json();
    const { query, variables } = requestPayload;

    logger.info('Shopify GraphQL Request Sent', { query: query.trim(), variables });
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-07';
    const response = await fetch(`https://telocalizo-tags.myshopify.com/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    logger.info('Shopify GraphQL Response Received', { data });

    return NextResponse.json(data);
  } catch (error: any) {
    logger.error('Shopify API Proxy Route Error', { 
      message: error.message, 
      stack: error.stack,
      payload: requestPayload 
    });
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
