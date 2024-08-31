import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';

export async function POST(request: NextRequest) {
  const response = await corsMiddleware(request, NextResponse.next());

  try {
    const { companyName, duration } = await request.json();

    if (!companyName || !duration) {
      return NextResponse.json({ message: 'Company name and duration are required' }, { status: 400, headers: response?.headers });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    await db.collection('attendanceSessions').updateMany(
      { isActive: true },
      { $set: { isActive: false, endTime: new Date() } }
    );

    const session = {
      companyName,
      duration: Number(duration),
      startTime: new Date(),
      endTime: new Date(Date.now() + Number(duration) * 60000),
      isActive: true
    };

    const result = await db.collection('attendanceSessions').insertOne(session);

    if (!result.insertedId) {
      throw new Error('Failed to insert new session');
    }

    return NextResponse.json({ message: 'Attendance window opened', session }, { headers: response?.headers });
  } catch (error) {
    console.error('Error starting attendance:', error);
    return NextResponse.json({ message: 'Error starting attendance', error: (error as Error).message }, { status: 500, headers: response?.headers ?? {} });
  }
}