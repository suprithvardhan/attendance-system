import express from 'express';
import {
	startAttendance,
	stopAttendance,
	markAttendance,
	getActiveSession,
	getAttendanceList
} from '../controllers/attendanceController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// All routes in this file should be protected
router.use(authenticateJWT);

// Start a new attendance session
router.post('/start', startAttendance);

// Stop an ongoing attendance session
router.post('/stop', stopAttendance);

// Mark attendance for a student
router.post('/mark', markAttendance);

// Get details of the active attendance session
router.get('/active', getActiveSession);

// Get the attendance list
router.get('/list', getAttendanceList);

export default router;
