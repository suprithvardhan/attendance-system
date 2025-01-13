import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  console.log('Stop attendance API route hit');
  try {
    const db = await getDb();

    const result = await db.collection('attendanceSessions').findOneAndUpdate(
      { isActive: true },
      { $set: { isActive: false, endTime: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result?.value) {
      console.log('No active attendance session found');
      return NextResponse.json({ message: 'No active attendance session found' }, { status: 404 });
    }

    console.log('Attendance session stopped:', result.value);

    return NextResponse.json({ message: 'Attendance session stopped', session: result.value });
  } catch (error) {
    console.error('Error stopping attendance:', error);
    return NextResponse.json({ message: 'Error stopping attendance', error: (error as Error).message }, { status: 500 });
  }
}