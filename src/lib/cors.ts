import { NextRequest, NextResponse } from 'next/server';

export async function corsMiddleware(req: NextRequest, res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200 });
  }
}