import { NextRequest, NextResponse } from 'next/server';
import { EventEmitter } from 'events';
import clientPromise from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';

const eventEmitter = new EventEmitter();

export async function GET(request: NextRequest) {
  await corsMiddleware(request as any, NextResponse as any);

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      const updateListener = (data: any) => {
        sendEvent(data);
      };

      eventEmitter.on('update', updateListener);

      const data = await fetchAttendanceData();
      sendEvent(data);

      const intervalId = setInterval(() => {
        controller.enqueue(': keepalive\n\n');
      }, 30000);

      return () => {
        clearInterval(intervalId);
        eventEmitter.off('update', updateListener);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function fetchAttendanceData() {
  const client = await clientPromise;
  const db = client.db('attendance_system');

  const latestSession = await db.collection('attendanceSessions')
    .findOne({}, { sort: { startTime: -1 } });

  const attendanceList = await db.collection('attendance')
    .find({ sessionId: latestSession?._id })
    .toArray();

  return { session: latestSession, attendanceList };
}

export async function updateAttendance() {
  const data = await fetchAttendanceData();
  eventEmitter.emit('update', data);
}