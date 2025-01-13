import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('adminToken')?.value;

  if (!token) {
    return new NextResponse(JSON.stringify({ isLoggedIn: false }), { status: 401 });
  }

  try {
    verify(token, process.env.JWT_SECRET || 'fallback_secret');
    return new NextResponse(JSON.stringify({ isLoggedIn: true }), { status: 200 });
  } catch {
    return new NextResponse(JSON.stringify({ isLoggedIn: false }), { status: 401 });
  }
}