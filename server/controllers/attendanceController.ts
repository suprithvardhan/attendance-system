import { Request, Response } from 'express';
import { io } from '../server';
import { logger } from '../utils/logger';
import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { getDb as getMongoDb } from '../../src/lib/mongodb';
dotenv.config({ path: '.env.local' });

let activeSession: any = null;
const attendanceSessions: any[] = [];
const attendanceList: any[] = [];
let db: Db | null = null;

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined in .env.local');
}
const client = new MongoClient(uri);

async function getDb(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db();
  }
  return db;
}

export const startAttendance = async (req: Request, res: Response) => {
  try {
    const { location, companyName, duration } = req.body;
    
    if (!location || !companyName || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDb();

    // Check if there's already an active session
    const activeSession = await db.collection('attendanceSessions')
      .findOne({ isActive: true });

    if (activeSession) {
      return res.status(400).json({ error: 'An active session already exists' });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const session = await db.collection('attendanceSessions').insertOne({
      companyName,
      startTime,
      endTime,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      }
    });

    const newSession = await db.collection('attendanceSessions')
      .findOne({ _id: session.insertedId });

    return res.status(201).json({ 
      message: 'Attendance session started', 
      session: newSession 
    });
  } catch (error) {
    console.error('Error starting attendance:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
};

export const stopAttendance = (req: Request, res: Response) => {
  if (!activeSession) {
    return res.status(400).json({ error: 'No active session found' });
  }

  activeSession.isActive = false;
  activeSession.endTime = Date.now();

  io.emit('attendanceSessionStopped', { sessionId: activeSession.id });

  logger.info(`Attendance session stopped: ${activeSession.id}`);
  activeSession = null;
  res.json({ message: 'Attendance session stopped' });
};

export const markAttendance = (req: Request, res: Response) => {
  const { rollNumber, location } = req.body;

  if (!activeSession) {
    return res.status(400).json({ error: 'No active session found' });
  }

  const attendanceRecord = {
    rollNumber,
    sessionId: activeSession.id,
    timestamp: new Date(),
    location
  };

  attendanceList.push(attendanceRecord);
  io.emit('attendanceMarked', attendanceRecord);

  logger.info(`Attendance marked for student ${rollNumber} in session ${activeSession.id}`);
  res.json({ message: 'Attendance marked successfully' });
};

export const getActiveSession = (req: Request, res: Response) => {
  if (activeSession) {
    res.json(activeSession);
  } else {
    res.status(404).json({ error: 'No active session found' });
  }
};

export const getAttendanceList = (req: Request, res: Response) => {
  res.json(attendanceList);
};

export const getAttendanceData = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const latestSession = await db.collection('attendanceSessions')
      .findOne({}, { sort: { startTime: -1 } });

    const attendanceList = await db.collection('attendance')
      .find({ sessionId: latestSession?._id })
      .toArray();

    const outOfCampusAttempts = await db.collection('outOfCampusAttempts')
      .find({ sessionId: latestSession?._id })
      .toArray();

    res.json({
      session: latestSession,
      attendanceList: attendanceList.map(record => ({ ...record, location: 'Campus' })),
      outOfCampusAttempts: outOfCampusAttempts.map(record => ({ ...record, location: 'Outside Campus' }))
    });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ error: 'An error occurred while fetching attendance data' });
  }
};