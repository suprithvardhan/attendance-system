// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { corsMiddleware } from '@/lib/cors';

export async function POST(request: NextRequest) {
  const response = await corsMiddleware(request, NextResponse.next());

  try {
    const { rollNumber, faceDescriptor } = await request.json();

    if (!rollNumber || !faceDescriptor) {
      return NextResponse.json({ message: 'Roll number and face descriptor are required' }, { status: 400, headers: response?.headers });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    const existingStudent = await db.collection('students').findOne({ rollNumber });

    if (existingStudent) {
      return NextResponse.json({ message: 'Student already registered' }, { status: 409, headers: response?.headers });
    }

    await db.collection('students').insertOne({
      rollNumber,
      faceDescriptor: Array.from(faceDescriptor),
      registeredAt: new Date()
    });

    return NextResponse.json({ message: 'Student registered successfully' }, { status: 201, headers: response?.headers });
  } catch (error) {
    console.error('Error registering student:', error);
    return NextResponse.json({ message: 'Error registering student', error: (error as Error).message }, { status: 500, headers: response?.headers ?? {} });
  }
}