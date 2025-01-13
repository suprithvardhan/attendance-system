import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';

const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = sign(
        { username },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: MAX_AGE }
      );

      const serialized = serialize('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: MAX_AGE,
        path: '/',
      });

      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Set-Cookie': serialized },
      });
    }

    return new NextResponse(JSON.stringify({ success: false }), { status: 401 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ success: false }), { status: 500 });
  }
}