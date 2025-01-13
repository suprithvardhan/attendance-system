import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('attendance_system');
    await db.command({ ping: 1 });
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
} 