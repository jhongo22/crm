import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

const HOKO_BASE = process.env.HOKO_BASE_URL || 'https://hoko.com.co/api';
const HOKO_TOKEN = process.env.HOKO_API_TOKEN || '';

export async function POST(request: NextRequest) {
  let requestType = 'Unknown';
  let requestUrl = '';
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      requestType = 'Multipart';
      const formData = await request.formData();
      const endpoint = formData.get('_endpoint') as string;
      const method = (formData.get('_method') as string) || 'POST';

      formData.delete('_endpoint');
      formData.delete('_method');

      const url = endpoint.startsWith('http') ? endpoint : `${HOKO_BASE}${endpoint}`;
      requestUrl = url;

      // Log request fields
      const logFields: Record<string, any> = {};
      formData.forEach((value, key) => {
        logFields[key] = typeof value === 'string' ? value : '[File/Binary]';
      });
      logger.info('Hoko Multipart Request Sent', { url, method, fields: logFields });

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${HOKO_TOKEN}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const status = response.status;
      const data = await response.json();
      logger.info('Hoko Response Received', { url, status, data });

      return NextResponse.json(data);
    }

    requestType = 'JSON';
    const { endpoint, method = 'GET', body, headers: extraHeaders } = await request.json();

    const url = endpoint.startsWith('http') ? endpoint : `${HOKO_BASE}${endpoint}`;
    requestUrl = url;

    logger.info('Hoko JSON Request Sent', { url, method, body, extraHeaders });

    const fetchOptions: RequestInit & { headers: Record<string, string> } = {
      method,
      headers: {
        Authorization: `Bearer ${HOKO_TOKEN}`,
        Accept: 'application/json',
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    if (extraHeaders) {
      Object.assign(fetchOptions.headers, extraHeaders);
    }

    const response = await fetch(url, fetchOptions);
    const status = response.status;
    const data = await response.json();
    logger.info('Hoko Response Received', { url, status, data });

    return NextResponse.json(data);
  } catch (error: any) {
    logger.error('Hoko API Proxy Route Error', { 
      requestType,
      url: requestUrl,
      message: error.message, 
      stack: error.stack 
    });
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
