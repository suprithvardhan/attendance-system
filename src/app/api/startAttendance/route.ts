// src/app/api/startAttendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient, Db } from 'mongodb';

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  let db: Db | null = null;

  try {
    const { companyName, duration, location } = await request.json();
    
    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    try {
      client = await clientPromise;
      db = client.db('attendance_system');
    } catch (error: unknown) {
      console.error('MongoDB connection error:', error);
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: 'Unable to establish database connection. Please try again.'
        },
        { status: 503 }
      );
    }

    // Test connection
    try {
      await db.command({ ping: 1 });
    } catch (error: unknown) {
      console.error('Database ping failed:', error);
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: 'Database connection test failed. Please try again.'
        },
        { status: 503 }
      );
    }

    // Check for active session
    const activeSession = await db.collection('attendanceSessions')
      .findOne({ isActive: true });

    if (activeSession) {
      return NextResponse.json(
        { error: 'An active session already exists' },
        { status: 400 }
      );
    }

    const session = await db.collection('attendanceSessions').insertOne({
      companyName: companyName.trim(),
      startTime: new Date(),
      endTime: new Date(Date.now() + Number(duration) * 60000),
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [Number(location.lng), Number(location.lat)]
      },
      duration: Number(duration)
    });

    const newSession = await db.collection('attendanceSessions')
      .findOne({ _id: session.insertedId });

    return NextResponse.json({
      message: 'Attendance session started',
      session: newSession
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error starting attendance:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}