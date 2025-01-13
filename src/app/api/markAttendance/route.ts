import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';
import { compareFaces, FACE_SIMILARITY_THRESHOLD } from '@/lib/faceRecognition';
import socket from '@/lib/socket';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function POST(request: NextRequest) {
  const response = await corsMiddleware(request, NextResponse.next());

  try {
    const { rollNumber, faceDescriptor, location } = await request.json();

    const db = await getDb();

    const [activeSession, student] = await Promise.all([
      db.collection('attendanceSessions').findOne({ isActive: true }),
      db.collection('students').findOne({ rollNumber })
    ]);

    if (!activeSession) {
      return NextResponse.json({ message: 'No active attendance session' }, { status: 400, headers: response?.headers });
    }

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404, headers: response?.headers });
    }

    // Check if student is within 300 meters of the admin's location
    const distance = calculateDistance(
      location.lat, location.lng,
      activeSession.location.lat, activeSession.location.lng
    );

    if (distance > 300) {
      return NextResponse.json({ message: 'You are not within the attendance area' }, { status: 403, headers: response?.headers });
    }

    const similarity = compareFaces(new Float32Array(faceDescriptor), new Float32Array(student.faceDescriptor));

    if (similarity < FACE_SIMILARITY_THRESHOLD) {
      const existingAttendance = await db.collection('attendance').findOne({
        rollNumber,
        sessionId: activeSession._id
      });

      if (existingAttendance) {
        return NextResponse.json({ message: 'Attendance already marked for this session' }, { status: 400, headers: response?.headers });
      }

      await db.collection('attendance').insertOne({
        rollNumber,
        timestamp: new Date(),
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address
        },
        sessionId: activeSession._id
      });

      // Emit socket event
      socket.emit('attendanceUpdate', { session: activeSession, rollNumber });

      return NextResponse.json({ message: 'Attendance marked successfully', rollNumber }, { headers: response?.headers });
    } else {
      return NextResponse.json({ message: 'Face recognition failed. Please try again.' }, { status: 403, headers: response?.headers });
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ message: 'Error marking attendance', error: (error as Error).message }, { status: 500, headers: response?.headers ?? {} });
  }
}
