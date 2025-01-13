import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getDistance } from 'geolib';

const CAMPUS_RADIUS = 300; // meters

export async function POST(request: NextRequest) {
	try {
		const { rollNumber, faceDescriptor, location } = await request.json();
		const client = await clientPromise;
		const db = client.db('attendance_system');

		// Get the active session
		const activeSession = await db.collection('attendanceSessions').findOne({ isActive: true });
		if (!activeSession) {
			return NextResponse.json({ message: 'No active attendance session' }, { status: 400 });
		}

		// Check if the student is within the campus radius
		const distance = getDistance(
			{ latitude: location.lat, longitude: location.lng },
			{ latitude: activeSession.location.lat, longitude: activeSession.location.lng }
		);

		const isWithinCampus = distance <= CAMPUS_RADIUS;

		if (isWithinCampus) {
			// Mark attendance
			await db.collection('attendance').insertOne({
				rollNumber,
				sessionId: activeSession._id,
				timestamp: new Date(),
				location: 'Campus'
			});

			return NextResponse.json({ message: 'Attendance marked successfully', rollNumber });
		} else {
			// Record out-of-campus attempt
			await db.collection('outOfCampusAttempts').insertOne({
				rollNumber,
				sessionId: activeSession._id,
				timestamp: new Date(),
				location: 'Outside Campus'
			});

			return NextResponse.json({ message: 'Attendance not marked. You are outside the campus.', outOfCampus: true }, { status: 403 });
		}
	} catch (error) {
		console.error('Error marking attendance:', error);
		return NextResponse.json({ message: 'Error marking attendance' }, { status: 500 });
	}
}