// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3002',
    methods: ['GET', 'POST']
  }
});

// Ensure the MongoDB URI is correctly set up in your .env file
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  console.error('MONGODB_URI is not set in the environment variables.');
  process.exit(1);
}

const mongoClient = new MongoClient(mongoUri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true, // Only for development
  tlsAllowInvalidHostnames: true, // Only for development
});

async function stopExpiredSessions(db) {
  const now = new Date();
  const result = await db.collection('attendanceSessions').updateMany(
    { isActive: true, endTime: { $lte: now } },
    { $set: { isActive: false } }
  );
  
  if (result.modifiedCount > 0) {
    console.log(`Stopped ${result.modifiedCount} expired session(s)`);
    const data = await fetchAttendanceData(db);
    io.emit('attendanceUpdate', data);
  }
}

async function stopAttendanceSession(db) {
  const result = await db.collection('attendanceSessions').findOneAndUpdate(
    { isActive: true },
    { $set: { isActive: false, endTime: new Date() } },
    { returnDocument: 'after' }
  );

  if (result.value) {
    console.log('Attendance session stopped:', result.value._id);
    const data = await fetchAttendanceData(db);
    io.emit('attendanceUpdate', data);
  }
}

async function startServer() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB Atlas');

    const db = mongoClient.db('attendance_system');
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log("Database connection test successful");

    // Schedule a task to run every minute to check for expired sessions
    cron.schedule('* * * * *', async () => {
      await stopExpiredSessions(db);
    });

    io.on('connection', (socket) => {
      console.log('A user connected');

      socket.on('requestInitialData', async () => {
        const data = await fetchAttendanceData(db);
        socket.emit('initialData', data);
      });

      socket.on('disconnect', () => {
        console.log('A client disconnected');
      });

      socket.on('stopAttendance', async () => {
        await stopAttendanceSession(db);
      });
    });

    const changeStream = db.collection('attendance').watch();
    changeStream.on('change', async () => {
      const data = await fetchAttendanceData(db);
      io.emit('attendanceUpdate', data);
    });

    const sessionChangeStream = db.collection('attendanceSessions').watch();
    sessionChangeStream.on('change', async () => {
      const data = await fetchAttendanceData(db);
      io.emit('attendanceUpdate', data);
    });

    // Add this new change stream
    const outOfCampusChangeStream = db.collection('outOfCampusAttempts').watch();
    outOfCampusChangeStream.on('change', async () => {
      const data = await fetchAttendanceData(db);
      io.emit('attendanceUpdate', data);
    });

    server.listen(process.env.PORT || 3001, () => {
      console.log(`Server running on port ${process.env.PORT || 3001}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function fetchAttendanceData(db) {
  try {
    const latestSession = await db.collection('attendanceSessions')
      .findOne({}, { sort: { startTime: -1 } });

    const attendanceList = latestSession 
      ? await db.collection('attendance')
          .find({ sessionId: latestSession._id })
          .toArray()
      : [];

    const outOfCampusAttempts = latestSession
      ? await db.collection('outOfCampusAttempts')
          .find({ sessionId: latestSession._id })
          .toArray()
      : [];

    return { 
      session: latestSession, 
      attendanceList: attendanceList.map(record => ({ ...record, location: 'Campus' })),
      outOfCampusAttempts: outOfCampusAttempts.map(record => ({ ...record, location: 'Outside Campus' }))
    };
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return { session: null, attendanceList: [], outOfCampusAttempts: [] };
  }
}

startServer();
