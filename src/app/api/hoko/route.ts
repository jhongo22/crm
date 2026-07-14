import { NextRequest, NextResponse } from 'next/server';

const HOKO_BASE = process.env.HOKO_BASE_URL || 'https://hoko.com.co/api';
const HOKO_TOKEN = process.env.HOKO_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const endpoint = formData.get('_endpoint') as string;
      const method = (formData.get('_method') as string) || 'POST';

      formData.delete('_endpoint');
      formData.delete('_method');

      const url = endpoint.startsWith('http') ? endpoint : `${HOKO_BASE}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${HOKO_TOKEN}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      return NextResponse.json(data);
    }

    const { endpoint, method = 'GET', body, headers: extraHeaders } = await request.json();

    const url = endpoint.startsWith('http') ? endpoint : `${HOKO_BASE}${endpoint}`;

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
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
