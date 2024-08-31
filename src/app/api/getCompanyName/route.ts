import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';

export async function GET(request: NextRequest) {
  await corsMiddleware(request as any, NextResponse as any);

  try {
    const client = await clientPromise;
    const db = client.db('attendance_system');

    const latestSession = await db.collection('attendanceSessions')
      .findOne({}, { sort: { startTime: -1 }, projection: { companyName: 1 } });

    if (!latestSession) {
      return NextResponse.json({ message: 'No attendance sessions found' }, { status: 404 });
    }

    return NextResponse.json({ companyName: latestSession.companyName });
  } catch (error) {
    console.error('Error fetching company name:', error);
    return NextResponse.json({ message: 'Error fetching company name' }, { status: 500 });
  }
}