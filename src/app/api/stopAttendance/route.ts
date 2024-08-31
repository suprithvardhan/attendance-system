import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';

export async function POST(request: NextRequest) {
  const response = await corsMiddleware(request, NextResponse.next());

  try {
    const client = await clientPromise;
    const db = client.db('attendance_system');

    const result = await db.collection('attendanceSessions').updateOne(
      { isActive: true },
      { $set: { isActive: false, endTime: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No active attendance session found' }, { status: 404, headers: response?.headers });
    }

    return NextResponse.json({ message: 'Attendance window closed' }, { headers: response?.headers });
  } catch (error) {
    console.error('Error stopping attendance:', error);
    return NextResponse.json({ message: 'Error stopping attendance' }, { status: 500, headers: response?.headers ?? {} });
  }
}