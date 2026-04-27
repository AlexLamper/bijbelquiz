import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'WebSocket upgrade required',
      },
    },
    { status: 426 },
  );
}
