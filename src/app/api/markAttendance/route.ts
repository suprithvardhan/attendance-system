import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { compareFaces, FACE_SIMILARITY_THRESHOLD } from '@/lib/faceRecognition';
import { updateAttendance } from '../attendanceStream/route';
import { corsMiddleware } from '@/lib/cors';

export async function POST(request: NextRequest) {
  const response = await corsMiddleware(request, NextResponse.next());
  console.log('Mark Attendance route accessed');

  try {
    const { rollNumber, faceDescriptor } = await request.json();
    console.log('Received data:', { rollNumber, faceDescriptor });

    const client = await clientPromise;
    const db = client.db('attendance_system');

    const [activeSession, student] = await Promise.all([
      db.collection('attendanceSessions').findOne({ isActive: true }),
      db.collection('students').findOne({ rollNumber })
    ]);

    if (!activeSession) {
      console.warn('No active attendance session found');
      return NextResponse.json({ message: 'No active attendance session' }, { status: 400, headers: response?.headers });
    }

    if (!student) {
      console.warn(`Student with roll number ${rollNumber} not found`);
      return NextResponse.json({ message: 'Student not found' }, { status: 404, headers: response?.headers });
    }

    const distance = compareFaces(new Float32Array(faceDescriptor), new Float32Array(student.faceDescriptor));
    console.log(`Face comparison result for student ${rollNumber}: Distance = ${distance}`);

    if (distance < FACE_SIMILARITY_THRESHOLD) {
      const existingAttendance = await db.collection('attendance').findOne({
        rollNumber,
        sessionId: activeSession._id
      });

      if (existingAttendance) {
        console.warn(`Attendance already marked for roll number ${rollNumber} in session ${activeSession._id}`);
        return NextResponse.json({ message: 'Attendance already marked for this session' }, { status: 400, headers: response?.headers });
      }

      await db.collection('attendance').insertOne({
        rollNumber,
        timestamp: new Date(),
        location: 'Campus',
        sessionId: activeSession._id
      });
      console.log(`Attendance marked for roll number ${rollNumber} in session ${activeSession._id}`);

      await updateAttendance();

      return NextResponse.json({ message: 'Attendance marked successfully' }, { headers: response?.headers });
    } else {
      console.warn(`Face recognition failed for roll number ${rollNumber}. Distance = ${distance}`);
      return NextResponse.json({ message: 'Face recognition failed. Please try again.' }, { status: 403, headers: response?.headers });
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ message: 'Error marking attendance' }, { status: 500, headers: response?.headers ?? {} });
  }
}
