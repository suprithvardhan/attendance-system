import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';

export async function GET(request: NextRequest) {
  const response = await corsMiddleware(request, NextResponse.next());

  try {
    const client = await clientPromise;
    const db = client.db('attendance_system');

    const activeSession = await db.collection('attendanceSessions')
      .findOne({ isActive: true }, { projection: { companyName: 1, _id: 0 } });

    if (!activeSession) {
      return NextResponse.json({ message: 'No active attendance session found' }, { status: 404, headers: response?.headers });
    }

    return NextResponse.json(activeSession, { headers: response?.headers });
  } catch (error) {
    console.error('Error fetching active session:', error);
    return NextResponse.json({ message: 'Error fetching active session' }, { status: 500, headers: response?.headers ?? {} });
  }
}