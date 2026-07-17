import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { level, message, context } = await request.json();
    if (level === 'ERROR') {
      logger.error(message, context);
    } else if (level === 'WARNING') {
      logger.warn(message, context);
    } else {
      logger.info(message, context);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
