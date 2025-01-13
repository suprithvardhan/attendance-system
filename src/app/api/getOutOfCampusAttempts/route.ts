import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';

export async function GET(request: NextRequest) {
  const response = await corsMiddleware(request, NextResponse.next());

  try {
    const client = await clientPromise;
    const db = client.db('attendance_system');

    const latestSession = await db.collection('attendanceSessions')
      .findOne({}, { sort: { startTime: -1 } });

    if (!latestSession) {
      return NextResponse.json({ message: 'No attendance sessions found' }, { status: 404 });
    }

    const outOfCampusAttempts = await db.collection('outOfCampusAttempts')
      .find({ sessionId: latestSession._id })
      .toArray();

    return NextResponse.json({ outOfCampusAttempts }, { headers: response?.headers });
  } catch (error) {
    console.error('Error fetching out-of-campus attempts:', error);
    return NextResponse.json({ message: 'Error fetching out-of-campus attempts' }, { status: 500, headers: response?.headers ?? {} });
  }
}